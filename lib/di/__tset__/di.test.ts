import { Injectable, QueryDependency, MockDependency, ProvideDependency, DIGetter, DIProperty, DenpendencyInjector } from '../di';

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

class UnexpectedError extends Error {}

test('injectable', () => {
    const b = QueryDependency(B);
    expect(b.aa.value).toBe(100);

    MockDependency(A, {value: 200});
    expect(QueryDependency(A).value).toBe(200);

    const c = new C();
    expect(c.a1.value).toBe(100);
    expect(c.a2.value).toBe(200);

    expect(c.aa.value).toBe(100);
    try {
        c.aa = null;
        throw new UnexpectedError('expect rejecting assignment');
    } catch (err) {if(err instanceof UnexpectedError) throw err;}

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
});


test('di object', () => {
    const injector = new DenpendencyInjector();
    expect(QueryDependency(E)).not.toBeNull();
    try {
        injector.QueryDependency(E);
        throw new UnexpectedError('expect rejecting assignment');
    } catch (err) {if(err instanceof UnexpectedError) throw err;}
});

