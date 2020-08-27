import fs from 'fs';
import path from 'path';
import url from 'url';

import { app, Certificate } from 'electron';
import i18next from 'i18next';

import { request, select, dispatch } from '../store';
import { AskForCertificateTrustResponse, askForCertificateTrust } from '../ui/main/dialogs';
import { getRootWindow } from '../ui/main/rootWindow';
import {
  CERTIFICATES_UPDATED,
  CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED,
  SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED,
  CERTIFICATES_LOADED,
} from './actions';

const t = i18next.t.bind(i18next);

const loadUserTrustedCertificates = async (): Promise<Record<string, string>> => {
  try {
    const filePath = path.join(app.getPath('userData'), 'certificate.json');
    const content = await fs.promises.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    await fs.promises.unlink(filePath);

    return json && typeof json === 'object' ? json : {};
  } catch (error) {
    return {};
  }
};

const serializeCertificate = (certificate: Certificate): string =>
  `${ certificate.issuerName }\n${ certificate.data.toString() }`;

const queuedTrustRequests = new Map<Certificate['fingerprint'], Array<(isTrusted: boolean) => void>>();

export const setupNavigation = async (): Promise<void> => {
  app.addListener('certificate-error', async (event, webContents, requestedUrl, error, certificate, callback) => {
    if (webContents.id !== getRootWindow().webContents.id) {
      return;
    }

    event.preventDefault();

    const serialized = serializeCertificate(certificate);
    const { host } = url.parse(requestedUrl);

    let trustedCertificates = select(({ trustedCertificates }) => trustedCertificates);

    const isTrusted = !!trustedCertificates[host] && trustedCertificates[host] === serialized;

    if (isTrusted) {
      callback(true);
      return;
    }

    if (queuedTrustRequests.has(certificate.fingerprint)) {
      queuedTrustRequests.get(certificate.fingerprint).push(callback);
      return;
    }

    queuedTrustRequests.set(certificate.fingerprint, [callback]);

    let detail = `URL: ${ requestedUrl }\nError: ${ error }`;
    if (trustedCertificates[host]) {
      detail = t('error.differentCertificate', { detail });
    }

    const response = await askForCertificateTrust(certificate.issuerName, detail);

    const isTrustedByUser = response === AskForCertificateTrustResponse.YES;

    queuedTrustRequests.get(certificate.fingerprint).forEach((cb) => cb(isTrustedByUser));
    queuedTrustRequests.delete(certificate.fingerprint);

    trustedCertificates = select(({ trustedCertificates }) => trustedCertificates);

    if (isTrustedByUser) {
      dispatch({
        type: CERTIFICATES_UPDATED,
        payload: { ...trustedCertificates, [host]: serialized },
      });
    }
  });

  app.addListener('select-client-certificate', async (event, _webContents, _url, certificateList, callback) => {
    event.preventDefault();

    const fingerprint = await request<
      typeof CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED,
      typeof SELECT_CLIENT_CERTIFICATE_DIALOG_CERTIFICATE_SELECTED | typeof SELECT_CLIENT_CERTIFICATE_DIALOG_DISMISSED
    >({
      type: CERTIFICATES_CLIENT_CERTIFICATE_REQUESTED,
      payload: JSON.parse(JSON.stringify(certificateList)),
    });
    const certificate = certificateList.find((certificate) => certificate.fingerprint === fingerprint);

    if (!certificate) {
      callback(null);
      return;
    }

    callback(certificate);
  });

  app.addListener('login', (event, _webContents, authenticationResponseDetails, _authInfo, callback) => {
    event.preventDefault();

    const servers = select(({ servers }) => servers);

    for (const server of servers) {
      const { host: serverHost, auth } = url.parse(server.url);
      const requestHost = url.parse(authenticationResponseDetails.url).host;

      if (serverHost !== requestHost || !auth) {
        callback();
        return;
      }

      const [username, password] = auth.split(/:/);
      callback(username, password);
    }
  });

  const trustedCertificates = select(({ trustedCertificates }) => trustedCertificates);
  const userTrustedCertificates = await loadUserTrustedCertificates();

  dispatch({
    type: CERTIFICATES_LOADED,
    payload: {
      ...trustedCertificates,
      ...userTrustedCertificates,
    },
  });
};
