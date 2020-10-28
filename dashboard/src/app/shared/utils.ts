
export * from '../../../../lib/common/utils';

export function nextTick(func) {
    setTimeout(func, 0);
}

export module validation {
  const __validName  = /^([A-Za-z]|\p{Unified_Ideograph})([A-Za-z0-9_]|\p{Unified_Ideograph}){2,}$/u;
  export function validName(name: string): boolean {
    return __validName.test(name);
  }

  export const MatchAll: string = '^.*$';
  export const NotMatch: string = '.^';
}

