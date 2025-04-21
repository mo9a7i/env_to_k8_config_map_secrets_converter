/** @jsxImportSource react */
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { parseEnvContent, generateConfigMapYaml, generateExternalSecretYaml, generateVaultJson } from '../lib/env-converter';

interface EnvLine {
  key: string;
  value: string;
  isSecret: boolean;
}

export function EnvConverter() {
  const [envContent, setEnvContent] = useState('');
  const [appName, setAppName] = useState('app');
  const [namespace, setNamespace] = useState('default');
  const [vaultPath, setVaultPath] = useState('app/secrets');
  const [envLines, setEnvLines] = useState<EnvLine[]>([]);

  // Derived values
  const configMapName = `${appName}-configmap`;

  useEffect(() => {
    const lines = parseEnvContent(envContent);
    setEnvLines(lines);
  }, [envContent]);

  function parseEnvContent(content: string): EnvLine[] {
    return content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        
        // Skip if value is empty
        if (!cleanValue) return null;
        
        // Check if key contains sensitive words
        const isSensitive = /password|key|secret|token|username/i.test(key);
        
        return {
          key: key.trim(),
          value: cleanValue,
          isSecret: isSensitive
        };
      })
      .filter((line): line is EnvLine => line !== null);
  }

  function generateConfigMapYaml(): string {
    const configMapLines = envLines.filter(line => !line.isSecret);
    
    let yaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${configMapName}
  namespace: ${namespace}
data:\n`;

    configMapLines.forEach(line => {
      yaml += `  ${line.key}: "${line.value}"\n`;
    });

    return yaml;
  }

  function generateExternalSecretYaml(): string {
    const secretLines = envLines.filter(line => line.isSecret);
    const secretName = `${appName}-secret`;
    
    let yaml = `apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ${secretName}
  namespace: ${namespace}
spec:
  refreshInterval: "15m"
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: ${secretName}
    creationPolicy: Owner
  data:\n`;

    secretLines.forEach(line => {
      yaml += `    - secretKey: ${line.key}
      remoteRef:
        key: ${vaultPath}
        property: ${line.key}\n`;
    });

    return yaml;
  }

  function generateVaultJson(): string {
    const secrets: Record<string, string> = {};
    envLines
      .filter(line => line.isSecret)
      .forEach(line => {
        secrets[line.key] = line.value;
      });
    
    return JSON.stringify(secrets, null, 2);
  }

  const handleToggleSecret = (index: number) => {
    const newEnvLines = [...envLines];
    newEnvLines[index].isSecret = !newEnvLines[index].isSecret;
    setEnvLines(newEnvLines);
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left Column */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">App Name</label>
          <Input 
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="app"
          />
          <p className="text-sm text-gray-500 mt-1">
            ConfigMap: {configMapName}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Namespace</label>
          <Input 
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Vault Path</label>
          <Input 
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            placeholder="app/secrets"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">.env Content</label>
          <Textarea 
            value={envContent}
            onChange={(e) => setEnvContent(e.target.value)}
            className="h-96 font-mono"
            placeholder="Paste your .env content here..."
          />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
          <div className="space-y-2">
            {envLines.map((line, index) => (
              <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                <Checkbox
                  checked={line.isSecret}
                  onCheckedChange={() => handleToggleSecret(index)}
                  className="h-4 w-4"
                />
                <span className="font-mono text-sm">{line.key}</span>
                <span className="font-mono text-sm text-gray-500 ml-2">= {line.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">ConfigMap YAML</h3>
            <Button onClick={() => navigator.clipboard.writeText(generateConfigMapYaml())}>
              Copy
            </Button>
          </div>
          <pre className="bg-gray-100 p-4 rounded h-64 overflow-auto">
            {generateConfigMapYaml()}
          </pre>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">ExternalSecret YAML</h3>
            <Button onClick={() => navigator.clipboard.writeText(generateExternalSecretYaml())}>
              Copy
            </Button>
          </div>
          <pre className="bg-gray-100 p-4 rounded h-64 overflow-auto">
            {generateExternalSecretYaml()}
          </pre>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Vault JSON</h3>
            <Button onClick={() => navigator.clipboard.writeText(generateVaultJson())}>
              Copy
            </Button>
          </div>
          <pre className="bg-gray-100 p-4 rounded h-64 overflow-auto">
            {generateVaultJson()}
          </pre>
        </div>
      </div>
    </div>
  );
} 