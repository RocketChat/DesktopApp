import { ipcRenderer } from 'electron';
import { useRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'redux';

import { SERVER_DOCUMENT_VIEWER_OPEN_URL } from '../../../servers/actions';
import type { RootAction } from '../../../store/actions';
import {
  LOADING_ERROR_VIEW_RELOAD_SERVER_CLICKED,
  WEBVIEW_ATTACHED,
  WEBVIEW_READY,
} from '../../actions';
import DocumentViewer from './DocumentViewer';
import ErrorView from './ErrorView';
import UnsupportedServer from './UnsupportedServer';
import { DocumentViewerWrapper, StyledWebView, Wrapper } from './styles';

type ServerPaneProps = {
  lastPath: string | undefined;
  serverUrl: string;
  isSelected: boolean;
  isFailed: boolean;
  isSupported: boolean | undefined;
  title: string | undefined;
  documentViewerOpenUrl: string | undefined;
  themeAppearance: string | undefined;
};

export const ServerPane = ({
  lastPath,
  serverUrl,
  isSelected,
  isFailed,
  isSupported,
  documentViewerOpenUrl,
  themeAppearance,
}: ServerPaneProps) => {
  const dispatch = useDispatch<Dispatch<RootAction>>();

  const [documentViewerActive, setDocumentViewerActive] = useState(false);

  const webviewRef =
    useRef<ReturnType<(typeof document)['createElement']>>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const handleWindowFocus = (): void => {
      if (!isSelected || isFailed) {
        return;
      }

      if (webview) webview.focus();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isFailed, isSelected, serverUrl]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }
    let step = false;
    const addEventListenerOnce = (
      e: 'did-attach' | 'dom-ready',
      cb: () => void
    ): void => {
      const handler = () => {
        cb();
        webview.removeEventListener(e, handler);
      };
      webview.addEventListener(e, handler);
    };

    const handleAttachReady = (): void => {
      step &&
        setTimeout(() => {
          dispatch({
            type: WEBVIEW_READY,
            payload: {
              url: serverUrl,
              webContentsId: webview.getWebContentsId(),
            },
          });
        }, 300);
      step = true;
    };
    addEventListenerOnce('did-attach', handleAttachReady);
    addEventListenerOnce('dom-ready', handleAttachReady);

    return () => {
      webview.removeEventListener('did-attach', handleAttachReady);
      webview.removeEventListener('dom-ready', handleAttachReady);
    };
  }, [dispatch, serverUrl]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }
    const addEventListenerOnce = (
      e: 'did-attach' | 'new-window',
      cb: () => void
    ): void => {
      const handler = () => {
        cb();
        webview.removeEventListener(e, handler);
      };
      webview.addEventListener(e, handler);
    };

    const handleAttachReady = (): void => {
      setTimeout(() => {
        dispatch({
          type: WEBVIEW_ATTACHED,
          payload: {
            url: serverUrl,
            webContentsId: webview.getWebContentsId(),
          },
        });
      }, 300);
    };

    const handleDidStartLoading = (): void => {
      webview.executeJavaScript(`
         document.addEventListener('click', function(event) {
            const fileDownloadURL = 'https://open.rocket.chat/file-upload';
            const isFileDownloadURL = event.target.href.startsWith(fileDownloadURL);
            const isTargetBlank = event.target.target === '_blank';

            if (isFileDownloadURL && isTargetBlank) {
              event.preventDefault()
              
              // Prepare download URL
              let downloadURL = event.target.href
              if (!downloadURL.endsWith('?download')) downloadURL += '?download'

              // Prepare file name
              const fileName = event.target.href.split('/').pop().split('?')[0];

              // Create link element
              const linkElement = document.createElement('a');
              linkElement.target = '_blank';
              linkElement.download = fileName;
              linkElement.href = downloadURL;
              
              // Stop propagation of the event to prevent infinite loop as document click event is also triggered
              linkElement.addEventListener('click', (e) => e.stopPropagation());
              
              // Add link element to DOM and click it
              document.body.appendChild(linkElement);
              linkElement.click();
            }
         })
      `);
    };

    addEventListenerOnce('did-attach', handleAttachReady);
    webview.addEventListener('did-start-loading', handleDidStartLoading);

    return () => {
      webview.removeEventListener('did-attach', handleAttachReady);
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
    };
  }, [dispatch, serverUrl]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    if (!webview.src) {
      webview.src = lastPath || serverUrl;
    }
  }, [lastPath, serverUrl]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    if (isSelected && documentViewerOpenUrl && documentViewerOpenUrl !== '') {
      setDocumentViewerActive(true);
    } else {
      setDocumentViewerActive(false);
    }
  }, [documentViewerOpenUrl, isSelected]);

  const handleReload = (): void => {
    dispatch({
      type: LOADING_ERROR_VIEW_RELOAD_SERVER_CLICKED,
      payload: { url: serverUrl },
    });
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (isSelected) {
      setTimeout(() => {
        webview?.focus();
      }, 100);
    } else {
      webview?.blur();
    }
    // setDocumentViewerActive(true);
  }, [isSelected]);

  const closeDocumentViewer = () => {
    dispatch({
      type: SERVER_DOCUMENT_VIEWER_OPEN_URL,
      payload: { server: serverUrl, documentUrl: '' },
    });
    setDocumentViewerActive(false);
  };

  useEffect(() => {
    const handleOnline = () => {
      ipcRenderer.invoke('refresh-supported-versions', serverUrl);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [serverUrl]);

  return (
    <Wrapper isVisible={isSelected}>
      <StyledWebView
        ref={webviewRef}
        isFailed={isFailed}
        partition={`persist:${serverUrl}`}
        {...({ allowpopups: 'allowpopups' } as any)}
      />{' '}
      <DocumentViewerWrapper isVisible={documentViewerActive}>
        <DocumentViewer
          url={documentViewerOpenUrl || ''}
          partition={`persist:${serverUrl}`}
          closeDocumentViewer={closeDocumentViewer}
          themeAppearance={themeAppearance}
        />
      </DocumentViewerWrapper>
      <UnsupportedServer
        isSupported={isSupported}
        instanceDomain={new URL(serverUrl).hostname}
      />
      <ErrorView isFailed={isFailed} onReload={handleReload} />
    </Wrapper>
  );
};
