import fs from 'fs';
import path from 'path';

import type { AxiosResponse } from 'axios';
import axios from 'axios';

const apiUrl =
  'https://releases.rocket.chat/v2/server/supportedVersions?source=desktop';
const outputFilePath = path.join('.', 'app', 'supportedVersions.jwt');

type SupportedVersionsResponse = {
  signed?: string;
};

export async function downloadAndSaveSupportedVersionsFromCloud(): Promise<void> {
  console.log('Getting Supported Versions from Cloud...');

  try {
    const response: AxiosResponse<SupportedVersionsResponse> = await axios.get(
      apiUrl
    );
    if (response.status === 200) {
      const jsonData: SupportedVersionsResponse = response.data;

      if (jsonData?.signed) {
        const signedContent: string = jsonData.signed;
        const directory = path.dirname(outputFilePath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }

        fs.writeFileSync(outputFilePath, signedContent);
        console.log('Signed content saved successfully.');
      } else {
        console.error(
          'JSON response does not contain the expected "signed" field.'
        );
      }
    } else {
      console.error('Failed to retrieve data from Cloud.');
    }
  } catch (error: any) {
    console.error(
      'Error getting the Supported Versions from Cloud:',
      error.message
    );
  }
}

downloadAndSaveSupportedVersionsFromCloud();
