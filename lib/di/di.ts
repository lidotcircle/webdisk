import 'reflect-metadata';
import assert from 'assert';

type Constructor =  {new (...args: any[]): object; };
interface InjectedClass {
    new (...args: any[]): object; 
};

type InjectedItem = InjectedClass | string;

type InjectOptions = {
    paramtypes?: InjectedItem[];
    name?: string;
    lazy?: boolean;
    afterInit?: (obj: any) => Promise<void>,
};

type GetterOptions = {
    dynamic?: boolean
};
const sym_promise_finish = Symbol('promise-finish');

export class DenpendencyInjector {
    private readonly sym_inject: symbol;
    private readonly sym_paramtypes: symbol;
    private readonly objectsMapping: {[key: number]: object};
    private readonly name2indexMapping: {[name: string]: number};
    private readonly inject2Class: {[key: number]: InjectedClass};
    private readonly initcallbacks: ((obj: any) => Promise<void> | void)[];
    private readonly promises: (() => Promise<void>)[];
    private injectableCounter: number;

    constructor() {
        this.sym_inject = Symbol('inject');
        this.sym_paramtypes = Symbol('paramtypes');
        this.objectsMapping = {};
        this.name2indexMapping = {};
        this.inject2Class = {};
        this.initcallbacks = [];
        this.promises = [];
        this.injectableCounter = 0;
    }

    /** class decrator */
    Injectable(options?: InjectOptions) //{
    {
        const ans = function<T extends Constructor>(target: T) {
            options = options || {};
            options.paramtypes = options.paramtypes || 
                Reflect.getMetadata('design:paramtypes', target) ||
                [];
            this.ProvideDependency(target, options);
        }
        return ans.bind(this);
    } //}

    private assertInjectable<T extends InjectedClass>(target: T) //{
    {
        assert(target[this.sym_inject] != null, "require an injectable class");
    } //}

    private assertValidName(name: string) //{
    {
        assert(this.name2indexMapping[name] > 0, "require a valid dependency name");
    } //}

    /** query dependency */
    QueryDependency<T extends Constructor | string>(specifier: T): T extends Constructor ? InstanceType<T> : any //{
    {
        let injectPoint;
        if(typeof specifier === 'function') {
            this.assertInjectable(specifier as any);
            injectPoint = specifier[this.sym_inject];
        } else {
            assert(typeof specifier === 'string', `invalid dependency specifier '${specifier}'`);
            this.assertValidName(specifier);
            injectPoint = this.name2indexMapping[specifier];
        }

        assert(injectPoint > 0, 'dependency not found');

        if(this.objectsMapping[injectPoint] === undefined) {
            this.instantiateInject(injectPoint);
        }
        return this.objectsMapping[injectPoint] as any;
    } //}

    /** async query dependency */
    async AsyncQueryDependency<T extends Constructor | string>(specifier: T): Promise<T extends Constructor ? InstanceType<T> : any> //{
    {
        const ans = this.QueryDependency(specifier);
        await this.ResolveInitPromises();
        return ans;
    } //}

    /** mock dependency */
    MockDependency<T extends Constructor>(dep: T | string, replacer: T | object, options?: {}) //{
    {
        options = Object.assign({}, options);

        if(typeof dep === 'function') {
            assert(dep[this.sym_inject] != null, "can't mock an class which isn't injectable");

            if(typeof replacer === 'function') {
                this.assertInjectable(replacer as T & InjectedClass);
                dep[this.sym_inject] = replacer[this.sym_inject];
            } else {
                const inj = dep[this.sym_inject];
                this.objectsMapping[inj] = replacer;
            }
        } else {
            assert(typeof dep === 'string', "dependency specifier should be a class or identifier");
            this.assertValidName(dep);

            if(typeof replacer === 'function') {
                this.assertInjectable(replacer as T & InjectedClass);
                this.name2indexMapping[dep] = replacer[this.sym_inject];
            } else {
                this.objectsMapping[this.name2indexMapping[dep]] = replacer;
            }
        }
    } //}

    /** provide dependency with varying methods */
    ProvideDependency<T extends Constructor>(provider: T | any, options?: InjectOptions & {object?: object}) //{
    {
        options = Object.assign({lazy: true}, options);

        if(typeof provider === 'function') {
            if(options.paramtypes == null) {
                assert(options.object !== undefined, "invalid dependency");
                this.ProvideDependencyClassWithObject(provider as any, options.object, options);
            } else {
                this.ProvideDependencyClass(provider as any, options);
            }
        } else {
            assert(options.name != null, "invalid dependency");
            this.ProvideDependencyObject(provider, options);
        }
    } //}

    /** provide class dependency */
    private ProvideDependencyClass<T extends InjectedClass>(provider: T, options: InjectOptions) //{
    {
        assert(provider[this.sym_inject] === undefined, "A class can't be provided twice");
        assert(typeof options.paramtypes === 'object', "A class provider should provide constructor types");

        const injectPoint = ++this.injectableCounter;
        provider[this.sym_inject] = injectPoint;
        provider[this.sym_paramtypes] = options.paramtypes;
        this.inject2Class[injectPoint] = provider;

        if(!!options.afterInit) {
            this.initcallbacks[injectPoint] = options.afterInit;
        }

        this.HandleOptionsWithInjectCounter(injectPoint, options);
    } //}

    /** provide class dependency with an instance */
    private ProvideDependencyClassWithObject<T extends InjectedClass>(provider: T, obj: object, options: InjectOptions) //{
    {
        assert(provider[this.sym_inject] === undefined, "A class can't be provided twice");

        const injectPoint = ++this.injectableCounter;
        provider[this.sym_inject] = injectPoint;
        this.inject2Class[injectPoint] = provider;
        this.objectsMapping[injectPoint] = obj;

        this.HandleOptionsWithInjectCounter(injectPoint, options);
    } //}

    /** provide object dependency */
    private ProvideDependencyObject(provider: object, options: InjectOptions) //{
    {
        assert(typeof options.name === 'string', "A object provider should provide name");
        assert(typeof provider !== 'function', "Providing a private dependency by name is prohibited");

        const injectPoint = ++this.injectableCounter;
        this.objectsMapping[injectPoint] = provider;

        this.HandleOptionsWithInjectCounter(injectPoint, options);
    } //}

    /** handle options with inject counter */
    private HandleOptionsWithInjectCounter(injectPoint: number, options: InjectOptions) //{
    {
        if(options.name) {
            assert(this.name2indexMapping[options.name] === undefined, "Defining a named dependency twice is invalid");
            this.name2indexMapping[options.name] = injectPoint;
        }

        if(!options.lazy && this.objectsMapping[injectPoint] === undefined) {
            this.instantiateInject(injectPoint);
        }
    } //}

    /** instantiate object with class */
    private instantiateInject(injectPoint: number) //{
    {
        assert(typeof injectPoint === 'number' && injectPoint > 0, `invalid dependency ${injectPoint}`);
        assert(this.objectsMapping[injectPoint] === undefined, "Instantiating a provider twice is illegal");
        assert(typeof this.inject2Class[injectPoint] === 'function', "invalid injectable index");

        const args: any[] = [];
        const target = this.inject2Class[injectPoint];
        assert(target != null, "instantiate object fail, not found");
        const args_type = target[this.sym_paramtypes];
        for(const thet of args_type) {
            let di;
            if(typeof thet === 'function') {       // constructor
                di = thet[this.sym_inject];
            } else if (typeof thet === 'string') { // object
                di = this.name2indexMapping[thet];
            }

            if(di == null) {
                console.debug(this);
                throw new Error(`Denpendency error, can't find '${thet.toString()}' when initialize ${target.name}`);
            }
            if(this.objectsMapping[di] === undefined) {
                this.instantiateInject(di);
            }
            args.push(this.objectsMapping[di]);
        }

        this.objectsMapping[injectPoint] = new target(...args);
        if(!!this.initcallbacks[injectPoint]) {
            const cb = this.initcallbacks[injectPoint];
            this.promises.push(async () => await cb(this.objectsMapping[injectPoint]));
        }
    } //}

    async ResolveInitPromises() //{
    {
        while(this.promises.length > 0) {
            const p = this.promises.shift()();
            try {
                await p;
            } catch (err) {
                console.debug(this);
                throw err;
            }
        }
    } //}

    /** getter decrator */
    DIGetter<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
    {
        const ans = function<U extends Constructor>(target: U | any, propertyKey: string, descriptor: PropertyDescriptor) {
            this.getterDescriptor(target, propertyKey, descriptor, specifier, options);
        }
        return ans.bind(this);
    } //}

    /** getter decrator */
    DIProperty<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
    {
        options = Object.assign({}, options);
        const ans = function<U extends Constructor>(target: U | any, propertyKey: string) {
            const cons = target as U;

            const descriptor: PropertyDescriptor = {};
            this.getterDescriptor(target, propertyKey, descriptor, specifier, options);
            Object.defineProperty(target, propertyKey, descriptor);
        }

        return ans.bind(this);
    } //}

    private getterDescriptor<T extends Constructor | string, U extends Constructor>(
        target: U | any, propertyKey: string, descriptor: PropertyDescriptor, 
        specifier: T, options: GetterOptions = {}) //{
    {
        options = Object.assign({}, options);
        let dynamic = !!options.dynamic;
        let staticObj;
        if(!dynamic) {
            staticObj = this.QueryDependency(specifier);
        }

        descriptor.get = () => {
            if(dynamic) {
                return this.QueryDependency(specifier);
            } else {
                return staticObj;
            }
        }

        descriptor.set = () => {
            throw new Error("setter of a DI property is prohibited");
        }
    } //}
}

export const GlobalInjector = new DenpendencyInjector();
export function Injectable(options?: InjectOptions) //{
{
    return GlobalInjector.Injectable(options);
} //}
export function QueryDependency<T extends Constructor | string>(specifier: T): T extends Constructor ? InstanceType<T> : any //{
{
    return GlobalInjector.QueryDependency(specifier);
} //}
export function MockDependency<T extends Constructor>(dep: T | string, replacer: T | object, options?: {}) //{
{
    return GlobalInjector.MockDependency(dep, replacer, options);
} //}
export function ProvideDependency<T extends Constructor>(provider: T | any, options?: InjectOptions & {object?: object}) //{
{
    return GlobalInjector.ProvideDependency(provider, options);
} //}
export function DIGetter<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
{
    return GlobalInjector.DIGetter(specifier, options);
} //}
export function DIProperty<T extends Constructor | string>(specifier: T, options: GetterOptions = {}) //{
{
    return GlobalInjector.DIProperty(specifier, options);
} //}
export async function ResolveInitPromises() //{
{
    await GlobalInjector.ResolveInitPromises();
} //}
export async function AsyncQueryDependency<T extends Constructor | string>(specifier: T): Promise<T extends Constructor ? InstanceType<T> : any> //{
{
    return await GlobalInjector.AsyncQueryDependency(specifier);
} //}

