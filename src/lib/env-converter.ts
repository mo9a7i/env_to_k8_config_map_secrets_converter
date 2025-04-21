interface EnvLine {
  key: string;
  value: string;
  isSecret: boolean;
}

interface VaultSecret {
  [key: string]: string;
}

export function parseEnvContent(content: string): EnvLine[] {
  return content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      // Remove quotes if they exist
      const cleanValue = value.replace(/^["']|["']$/g, '');
      return {
        key: key.trim(),
        value: cleanValue,
        isSecret: false // This will be updated by the UI
      };
    });
}

export function generateConfigMapYaml(envLines: EnvLine[], name: string, namespace: string): string {
  const configMapLines = envLines.filter(line => !line.isSecret);
  
  let yaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}
  namespace: ${namespace}
data:\n`;

  configMapLines.forEach(line => {
    yaml += `  ${line.key}: "${line.value}"\n`;
  });

  return yaml;
}

export function generateExternalSecretYaml(envLines: EnvLine[], name: string, namespace: string, vaultPath: string): string {
  const secretLines = envLines.filter(line => line.isSecret);
  
  let yaml = `apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ${name}
  namespace: ${namespace}
spec:
  refreshInterval: "15m"
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: ${name}
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

export function generateVaultJson(envLines: EnvLine[]): string {
  const secrets: VaultSecret = {};
  envLines
    .filter(line => line.isSecret)
    .forEach(line => {
      secrets[line.key] = line.value;
    });
  
  return JSON.stringify(secrets, null, 2);
} 