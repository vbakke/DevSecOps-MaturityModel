export { perfNow, isEmptyObj, hasData, deepCopy };

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
