import { Injectable, QueryDependency, MockDependency, ProvideDependency, DIGetter, DIProperty, DependencyInjector, InjectableFactory } from '../di';

@Injectable()
class A {
    value: number = 100;
}

@Injectable({name: 'nobb'})
class B {
    constructor(private a: A) {}

    get aa() {return this.a;}
}

class C {
    @DIGetter(A)
    get a1(): A {return null}

    @DIGetter(A, {dynamic: true})
    get a2(): A {return null}

    @DIProperty(A)
    aa: A;
}

test('injectable', () => {
    const b = QueryDependency(B);
    expect(b.aa.value).toBe(100);

    MockDependency(A, null, {object: {value: 200}});
    expect(QueryDependency(A).value).toBe(200);

    const c = new C();
    expect(c.a1.value).toBe(100);
    expect(c.a2.value).toBe(200);

    expect(c.aa.value).toBe(100);
    expect(() => c.aa = null).toThrowError();

    const nobb = QueryDependency('nobb') as B;
    expect(nobb.aa.value).toBe(100);
});

class D {}

@Injectable()
class E {
    constructor(d: D) {}
}
test('injectable object', () => {
    ProvideDependency(D, {object: {vv: 300}, name: 'goodd'});
    expect(typeof QueryDependency(D)).toBe('object');
    expect(QueryDependency(D) instanceof D).toBeFalsy();
    expect(QueryDependency(D)).toBe(QueryDependency('goodd'));

    ProvideDependency(null, {name: 'common', object: 'hello'});
    expect(QueryDependency('common')).toBe('hello');

    @Injectable({
        paramtypes: ['uvw']
    })
    class U {
        u: string;
        constructor(u: string) {
            this.u = u;
        }
    }
    ProvideDependency(null, {name: 'uvw', object: 'nope'});
    const b = QueryDependency(U);
    expect(b.u).toBe('nope');

    @Injectable()
    class P {
        constructor(private u: U) {}
    }
    const p = QueryDependency(P);
    expect(p instanceof P).toBeTruthy();
});


test('di object', () => {
    const injector = new DependencyInjector();
    expect(QueryDependency(E)).not.toBeNull();
    expect(() => injector.QueryDependency(E)).toThrowError();
});


test('method decrator', () => {
    @Injectable()
    class AA {}

    class A {
        @InjectableFactory(null, {name: 'uv'})
        factory(a: AA) {
            return new AA();
        }
    }

    const uv = QueryDependency('uv') as AA;
    expect(uv instanceof AA).toBeTruthy();
});

