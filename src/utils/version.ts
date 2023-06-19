export function compareVersions(
  version1: string,
  operator: string,
  version2: string
): boolean {
  const v1 = version1.match(/\d+/g)?.map(Number) || [];
  const v2 = version2.match(/\d+/g)?.map(Number) || [];

  for (let i = 0; i < 3; i++) {
    const n1 = v1[i] || 0;
    const n2 = v2[i] || 0;

    switch (operator) {
      case '>=':
        if (n1 < n2) {
          return false;
        }
        break;
      case '>':
        if (n1 <= n2) {
          return false;
        }
        break;
      case '<=':
        if (n1 > n2) {
          return false;
        }
        break;
      case '<':
        if (n1 >= n2) {
          return false;
        }
        break;
      case '==':
        if (n1 !== n2) {
          return false;
        }
        break;
      default:
        throw new Error(`Invalid operator: ${operator}`);
    }
  }

  return true;
}
