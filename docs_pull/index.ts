import axios, { AxiosResponse, AxiosError } from 'axios';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';

interface InputMarkdown {
  type_id: string;
  content: string;
}


interface DocsConfig {
  theme: string;
  name: string;
  colors: {
    primary: string;
    light: string;
    dark: string;
  };
  favicon: string;
  navigation: {
    tabs: {
      tab: string;
      groups: {
        group: string;
        pages: string[];
      }[];
    }[];
    global: {
      anchors: any[];
    };
  };
  logo: {
    light: string;
    dark: string;
  };
  navbar: {
    links: {
      label: string;
      href: string;
    }[];
    primary: {
      type: string;
      label: string;
      href: string;
    };
  };
  footer: {
    socials: {
      x: string;
      github: string;
      linkedin: string;
    };
  };
}

export const getInputMarkdowns = async (
  baseUrl: string = 'https://localhost',
): Promise<InputMarkdown[]> => {
  try {
    const response: AxiosResponse<InputMarkdown[]> = await axios({
      method: 'GET',
      url: `${baseUrl}/api/v1/inputs/markdowns`,
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1wWlR5dlVFbjdIREl0LXM1YndEbSJ9.eyJodHRwczovL21vbmFkLnNlY3VyaXR5LmNvbS9hcHBfbWV0YWRhdGEiOnsiZW1haWwiOiJhbmVlc2hAbW9uYWQuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJpc3MiOiJodHRwczovL21vbmFkLXYyLWRldi51cy5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NjYzMTc0MTJmYTIwNWY1NGM1MmQ5MTIwIiwiYXVkIjoiaHR0cHM6Ly9tb25hZC5zZWN1cml0eS9hcGkiLCJpYXQiOjE3NDE3NDU5MTgsImV4cCI6MTc0MTgzMjMxOCwiZ3R5IjoicGFzc3dvcmQiLCJhenAiOiIzUUFwYWpRZm5sZzV4YUc5RzVVMkRmSk9RYUVGU3lVNSIsInBlcm1pc3Npb25zIjpbXX0.sNMqvzR_CewektjBQcZubKzvmssaiU15X2UUPyD1BukpRt1_7KUg9EauURrm-LS9SeX05NLdcCYq7u1MKwWzK5xBKsXkFo5kFFQ1CfmXyC2La5zId-sCmAZmCbiXSIWVDbSdaB06Xl4S8Y45pg-ZB-acvaK6r08KsDCc2sAE0QIE2xKPzG6MgIetnYGGnR17XIOj7ZwqRmnmAVyr6JjULcSE97t11GrMN-YoauXryN7Y0xF0vWbQgGgPv2_Uwko0P_NW-CrBn1wzdhVxnv14MgfUbI4D1DVivpC2r_ZDmd1NmoSjsnt7inewSUuXfq9qd0S10dPQCLR-1YNdi3zZwA`
      },
      httpsAgent: new https.Agent({ 
        rejectUnauthorized: false 
      })
    });
    
    return response.data;
  } catch (error) {
    handleApiError(error as AxiosError);
    throw error;
  }
};

const handleApiError = (error: AxiosError): void => {
  if (error.response) {
    console.error('API Error Response:', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    });
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Request configuration error:', error.message);
  }
};

const writeMarkdownFiles = async (inputsData: InputMarkdown[]): Promise<void> => {
  try {
    const inputsDir = path.join(process.cwd(), 'inputs');
    await fs.mkdir(inputsDir, { recursive: true });
    
    for (const input of inputsData) {
      // Convert type_id to filename
      // Example: "slack-groups" -> "slack-groups.mdx"
      const filename = `${input.type_id}.mdx`;
      const filePath = path.join(inputsDir, filename);
      
      console.log(`Writing file: ${filePath}`);
      await fs.writeFile(filePath, input.content);
    }
    
    console.log('All markdown files written successfully');
  } catch (error) {
    console.error('Error writing markdown files:', error);
    throw error;
  }
};

const updateDocsConfig = async (inputsData: InputMarkdown[]): Promise<void> => {
  try {
    const configPath = path.join(process.cwd(), 'docs.json');
    const configStr = await fs.readFile(configPath, 'utf-8');
    const config: DocsConfig = JSON.parse(configStr);
    
    const guidesTab = config.navigation.tabs.find(tab => tab.tab === 'Guides');
    if (guidesTab) {
      const inputsGroup = guidesTab.groups.find(group => group.group === 'Inputs');
      if (inputsGroup) {
        inputsGroup.pages = inputsData.map(input => `inputs/${input.type_id}`);
        
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log('docs.json updated successfully');
      } else {
        console.warn('Inputs group not found in the Guides tab');
      }
    } else {
      console.warn('Guides tab not found in the navigation config');
    }
  } catch (error) {
    console.error('Error updating docs.json:', error);
    throw error;
  }
};

const main = async () => {
  try {
    const result = await getInputMarkdowns();
    console.log(`Fetched ${result.length} markdown inputs`);
    
    await writeMarkdownFiles(result);
    
    await updateDocsConfig(result);
    
    console.log('Process completed successfully');
  } catch (error) {
    console.error('Error in main process:', error);
  }
};

main();