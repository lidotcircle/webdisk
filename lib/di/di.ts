import 'reflect-metadata';
import assert from 'assert';

const sym_inject = Symbol('inject');
const sym_paramtypes = Symbol('paramtypes');
const objectsMapping: {[key: number]: object} = {};
const name2indexMapping: {[name: string]: number} = {};
const inject2Class: {[key: number]: InjectedClass} = {};
let injectableCounter = 0;

type Constructor =  {new (...args: any[]): object; };
interface InjectedClass {
    new (...args: any[]): object; 
    [sym_inject]: number; 
    [sym_paramtypes]: InjectedItem[];
};

type InjectedItem = InjectedClass | string;

type InjectOptions = {
    paramtypes?: InjectedItem[];
    name?: string;
    lazy?: boolean;
};

/** class decrator */
export function Injectable(options?: InjectOptions) //{
{
    return function<T extends Constructor>(target: T) {
        options = options || {};
        options.paramtypes = options.paramtypes || 
            Reflect.getMetadata('design:paramtypes', target) ||
            [];
        ProvideDependency(target, options);
    }
} //}

function assertInjectable<T extends InjectedClass>(target: T) //{
{
    assert(target[sym_inject] != null, "require an injectable class");
} //}

function assertValidName(name: string) //{
{
    assert(name2indexMapping[name] > 0, "require a valid dependency name");
} //}

/** query dependency */
export function QueryDependency<T extends Constructor | string>(specifier: T): T extends Constructor ? InstanceType<T> : any //{
{
    let injectPoint;
    if(typeof specifier === 'function') {
        assertInjectable(specifier as any);
        injectPoint = specifier[sym_inject];
    } else {
        assert(typeof specifier === 'string', `invalid dependency specifier '${specifier}'`);
        assertValidName(specifier);
        injectPoint = name2indexMapping[specifier];
    }

    assert(injectPoint > 0, 'dependency not found');

    if(objectsMapping[injectPoint] === undefined) {
        instantiateInject(injectPoint);
    }
    return objectsMapping[injectPoint] as any;
} //}

/** mock dependency */
export function MockDependency<T extends Constructor>(dep: T | string, replacer: T | object, options?: {}) //{
{
    options = Object.assign({}, options);

    if(typeof dep === 'function') {
        assert(dep[sym_inject] != null, "can't mock an class which isn't injectable");

        if(typeof replacer === 'function') {
            assertInjectable(replacer as T & InjectedClass);
            dep[sym_inject] = replacer[sym_inject];
        } else {
            const inj = dep[sym_inject];
            objectsMapping[inj] = replacer;
        }
    } else {
        assert(typeof dep === 'string', "dependency specifier should be a class or identifier");
        assertValidName(dep);

        if(typeof replacer === 'function') {
            assertInjectable(replacer as T & InjectedClass);
            name2indexMapping[dep] = replacer[sym_inject];
        } else {
            objectsMapping[name2indexMapping[dep]] = replacer;
        }
    }
} //}

/** provide dependency with varying methods */
export function ProvideDependency<T extends Constructor>(provider: T, options?: InjectOptions & {object?: object}) //{
{
    options = Object.assign({lazy: true}, options);

    if(typeof provider === 'function') {
        if(options.paramtypes == null) {
            assert(options.object !== undefined, "invalid dependency");
            ProvideDependencyClassWithObject(provider as any, options.object, options);
        } else {
            ProvideDependencyClass(provider as any, options);
        }
    } else {
        assert(options.name != null, "invalid dependency");
        ProvideDependencyObject(provider, options);
    }
} //}

/** provide class dependency */
function ProvideDependencyClass<T extends InjectedClass>(provider: T, options: InjectOptions) //{
{
    assert(provider[sym_inject] === undefined, "A class can't be provided twice");
    assert(typeof options.paramtypes === 'object', "A class provider should provide constructor types");

    const injectPoint = ++injectableCounter;
    provider[sym_inject] = injectPoint;
    provider[sym_paramtypes] = options.paramtypes;
    inject2Class[injectPoint] = provider;

    HandleOptionsWithInjectCounter(injectPoint, options);
} //}

/** provide class dependency with an instance */
function ProvideDependencyClassWithObject<T extends InjectedClass>(provider: T, obj: object, options: InjectOptions) //{
{
    assert(provider[sym_inject] === undefined, "A class can't be provided twice");

    const injectPoint = ++injectableCounter;
    provider[sym_inject] = injectPoint;
    inject2Class[injectPoint] = provider;
    objectsMapping[injectPoint] = obj;

    HandleOptionsWithInjectCounter(injectPoint, options);
} //}

/** provide object dependency */
function ProvideDependencyObject(provider: object, options: InjectOptions) //{
{
    assert(typeof options.name === 'string', "A object provider should provide name");
    assert(typeof provider !== 'function', "Providing a function dependency by name is prohibited");

    const injectPoint = ++injectableCounter;
    objectsMapping[injectPoint] = provider;

    HandleOptionsWithInjectCounter(injectPoint, options);
} //}

/** handle options with inject counter */
function HandleOptionsWithInjectCounter(injectPoint: number, options: InjectOptions) //{
{
    if(options.name) {
        assert(name2indexMapping[options.name] === undefined, "Defining a named dependency twice is invalid");
        name2indexMapping[options.name] = injectPoint;
    }

    if(!options.lazy && objectsMapping[injectPoint] === undefined) {
        instantiateInject(injectPoint);
    }
} //}

/** instantiate object with class */
function instantiateInject(injectPoint: number) //{
{
    assert(typeof injectPoint === 'number' && injectPoint > 0, "invalid dependency");
    assert(objectsMapping[injectPoint] === undefined, "Instantiating a provider twice is illegal");
    assert(typeof inject2Class[injectPoint] === 'function', "invalid injectable index");

    const args: any[] = [];
    const target = inject2Class[injectPoint];
    assert(target != null, "instantiate object fail, not found");
    const args_type = target[sym_paramtypes];
    for(const thet of args_type) {
        let di;
        if(typeof thet === 'function') {       // constructor
            di = thet[sym_inject];
        } else if (typeof thet === 'string') { // object
            di = name2indexMapping[thet];
        }

        if(di === null) {
            throw new Error(`Denpendency error, can't find '${thet.toString()}'`);
        }
        if(objectsMapping[di] === undefined) {
            instantiateInject(di);
        }
        args.push(objectsMapping[di]);
    }

    objectsMapping[injectPoint] = new target(...args);
} //}

type GetterOptions = {
    dynamic?: boolean
};

/** getter decrator */
export function DIGetter<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
{
    return function<U extends Constructor>(target: U | any, propertyKey: string, descriptor: PropertyDescriptor) {
        getterDescriptor(target, propertyKey, descriptor, specifier, options);
    }
} //}

/** getter decrator */
export function DIProperty<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
{
    options = Object.assign({}, options);
    return function<U extends Constructor>(target: U | any, propertyKey: string) {
        const cons = target as U;

        const descriptor: PropertyDescriptor = {};
        getterDescriptor(target, propertyKey, descriptor, specifier, options);
        Object.defineProperty(target, propertyKey, descriptor);
    }
} //}

function getterDescriptor<T extends Constructor | string, U extends Constructor>(
    target: U | any, propertyKey: string, descriptor: PropertyDescriptor, 
    specifier: T, options: GetterOptions = {}) //{
{
    options = Object.assign({}, options);
    let dynamic = !!options.dynamic;
    let staticObj;
    if(!dynamic) {
        staticObj = QueryDependency(specifier);
    }

    descriptor.get = () => {
        if(dynamic) {
            return QueryDependency(specifier);
        } else {
            return staticObj;
        }
    }

    descriptor.set = () => {
        throw new Error("setter of a DI property is prohibited");
    }
} //}

