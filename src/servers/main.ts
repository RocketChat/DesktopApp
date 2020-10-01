import fs from 'fs';
import path from 'path';

import AbortController from 'abort-controller';
import { app } from 'electron';
import fetch from 'node-fetch';
import { satisfies, coerce } from 'semver';

import {
  CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED,
} from '../navigation/actions';
import { select, dispatch, listen } from '../store';
import { ActionOf } from '../store/actions';
import {
  SERVER_URL_RESOLUTION_REQUESTED,
  SERVER_URL_RESOLVED,
  SERVERS_LOADED,
} from './actions';
import { ServerUrlResolutionStatus, Server, ServerUrlResolutionResult } from './common';

const REQUIRED_SERVER_VERSION_RANGE = '>=2.4.0';

export const convertToURL = (input: string): URL => {
  let url: URL;

  if (/^https?:\/\//.test(input)) {
    url = new URL(input);
  } else {
    url = new URL(`https://${ input }`);
  }

  const { protocol, username, password, hostname, port, pathname } = url;
  return Object.assign(new URL('https://0.0.0.0'), {
    protocol,
    username,
    password,
    hostname,
    port: (protocol === 'http' && port === '80' && undefined)
      || (protocol === 'https' && port === '443' && undefined)
      || port,
    pathname: /\/$/.test(pathname) ? pathname : `${ pathname }/`,
  });
};

const fetchServerInformation = async (url: URL): Promise<[finalURL: URL, version: string]> => {
  const { username, password } = url;
  const headers: HeadersInit = [];

  if (username && password) {
    headers.push(['Authorization', `Basic ${ Buffer.from(`${ username }:${ password }`).toString('base64') }`]);
  }

  const endpoint = new URL('api/info', url);

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 5000);

  const response = await fetch(endpoint, {
    headers,
    signal: controller.signal,
  });

  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const responseBody: {
    success: boolean;
    version: string;
  } = await response.json();

  if (!responseBody.success) {
    throw new Error();
  }

  return [new URL('/', convertToURL(response.url)), responseBody.version];
};

export const resolveServerUrl = async (input: string): Promise<ServerUrlResolutionResult> => {
  let url: URL;

  try {
    url = convertToURL(input);
  } catch (error) {
    return [input, ServerUrlResolutionStatus.INVALID_URL, error];
  }

  let version: string;

  try {
    [url, version] = await fetchServerInformation(url);
  } catch (error) {
    if (!/(^https?:\/\/)|(\.)|(^([^:]+:[^@]+@)?localhost(:\d+)?$)/.test(input)) {
      return resolveServerUrl(`https://${ input }.rocket.chat`);
    }

    if (error.name === 'AbortError') {
      return [url.href, ServerUrlResolutionStatus.TIMEOUT, error];
    }

    return [url.href, ServerUrlResolutionStatus.INVALID, error];
  }

  if (!satisfies(coerce(version), REQUIRED_SERVER_VERSION_RANGE)) {
    return [
      url.href,
      ServerUrlResolutionStatus.INVALID,
      new Error(`incompatible server version (${ version }, expected ${ REQUIRED_SERVER_VERSION_RANGE })`),
    ];
  }

  return [url.href, ServerUrlResolutionStatus.OK];
};

const loadAppServers = async (): Promise<Record<string, string>> => {
  try {
    const filePath = path.join(
      app.getAppPath(),
      app.getAppPath().endsWith('app.asar') ? '..' : '.',
      'servers.json',
    );
    const content = await fs.promises.readFile(filePath, 'utf8');
    const json = JSON.parse(content);

    return json && typeof json === 'object' ? json : {};
  } catch (error) {
    return {};
  }
};

const loadUserServers = async (): Promise<Record<string, string>> => {
  try {
    const filePath = path.join(app.getPath('userData'), 'servers.json');
    const content = await fs.promises.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    await fs.promises.unlink(filePath);

    return json && typeof json === 'object' ? json : {};
  } catch (error) {
    return {};
  }
};

export const setupServers = async (localStorage: Record<string, string>): Promise<void> => {
  listen(SERVER_URL_RESOLUTION_REQUESTED, async (action) => {
    try {
      dispatch({
        type: SERVER_URL_RESOLVED,
        payload: await resolveServerUrl(action.payload),
        meta: {
          response: true,
          id: action.meta?.id,
        },
      });
    } catch (error) {
      dispatch({
        type: SERVER_URL_RESOLVED,
        payload: error,
        error: true,
        meta: {
          response: true,
          id: action.meta?.id,
        },
      });
    }
  });

  listen(CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED, (action) => {
    const isResponse: Parameters<typeof listen>[0] = (responseAction) =>
      [
        SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED,
        SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED,
      ].includes(responseAction.type)
      && responseAction.meta?.id === action.meta.id;

    const unsubscribe = listen(isResponse, (responseAction: ActionOf<
      typeof SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED
    | typeof SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED
    >) => {
      unsubscribe();

      const fingerprint = responseAction.type === SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED
        ? responseAction.payload
        : null;

      dispatch({
        type: SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED,
        payload: fingerprint,
        meta: {
          response: true,
          id: action.meta?.id,
        },
      });
    });
  });

  let servers = select(({ servers }) => servers);
  let currentServerUrl = select(({ currentServerUrl }) => currentServerUrl);

  const serversMap = new Map<Server['url'], Server>(
    servers
      .filter(Boolean)
      .filter(({ url, title }) => typeof url === 'string' && typeof title === 'string')
      .map((server) => [server.url, server]),
  );

  if (localStorage['rocket.chat.hosts']) {
    try {
      const storedString = JSON.parse(localStorage['rocket.chat.hosts']);

      if (/^https?:\/\//.test(storedString)) {
        serversMap.set(storedString, { url: storedString, title: storedString });
      } else {
        const storedValue = JSON.parse(storedString);

        if (Array.isArray(storedValue)) {
          storedValue.map((url) => url.replace(/\/$/, '')).forEach((url) => {
            serversMap.set(url, { url, title: url });
          });
        }
      }
    } catch (error) {
      console.warn(error);
    }
  }

  if (serversMap.size === 0) {
    const appConfiguration = await loadAppServers();

    for (const [title, url] of Object.entries(appConfiguration)) {
      serversMap.set(url, { url, title });
    }

    const userConfiguration = await loadUserServers();

    for (const [title, url] of Object.entries(userConfiguration)) {
      serversMap.set(url, { url, title });
    }
  }

  if (localStorage['rocket.chat.currentHost'] && localStorage['rocket.chat.currentHost'] !== 'null') {
    currentServerUrl = localStorage['rocket.chat.currentHost'];
  }

  servers = Array.from(serversMap.values());
  currentServerUrl = serversMap.get(currentServerUrl)?.url ?? null;

  if (localStorage['rocket.chat.sortOrder']) {
    try {
      const sorting = JSON.parse(localStorage['rocket.chat.sortOrder']);
      if (Array.isArray(sorting)) {
        servers = [...serversMap.values()]
          .sort((a, b) => sorting.indexOf(a.url) - sorting.indexOf(b.url));
      }
    } catch (error) {
      console.warn(error);
    }
  }

  dispatch({
    type: SERVERS_LOADED,
    payload: {
      servers,
      currentServerUrl,
    },
  });
};
