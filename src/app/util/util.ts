export { perfNow, isEmptyObj, hasData, deepCopy, equalArray };

function perfNow(): string {
  return (performance.now() / 1000).toFixed(3);
}

function isEmptyObj(obj: any): boolean {
  for (let tmp in obj) {
    return false;
  }
  return true;
}

function hasData(obj: any): boolean {
  for (let tmp in obj) {
    return true;
  }
  return false;
}

function deepCopy(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

function equalArray(a: any[]|undefined|null, b: any[]|undefined|null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  return a.every((v, i) => v === b[i]);
}
