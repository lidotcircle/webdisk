import 'reflect-metadata';
import assert from 'assert';
import { EventEmitter } from 'events';

type Constructor =  {new (...args: any[]): object; };

type InjectedSpecifier = Constructor | string;
type ObjectFactory = (...args: any[]) => object;

type InjectOptions = {
    factory?: ObjectFactory;
    object?: any;

    paramtypes?: InjectedSpecifier[];
    name?: string;

    afterInit?: (obj: any) => Promise<void>;
    lazy?: boolean;
    initOnDeps?: InjectedSpecifier[];
    initOnDepsInstantiated?: InjectedSpecifier[];
    initOnDepsInited?: InjectedSpecifier[];
};

export interface DependencyInjector {
    on(event: 'dependency', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    on(event: 'instantiated', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    on(event: 'initialized', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    on(event: 'mock',       listener: (depSpecifier: InjectedSpecifier, replace: InjectedSpecifier) => void): this;

    once(event: 'dependency', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    once(event: 'instantiated', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    once(event: 'initialized', listener: (dependency: Constructor | null, options: InjectOptions) => void): this;
    once(event: 'mock',       listener: (depSpecifier: InjectedSpecifier, replace: InjectedSpecifier) => void): this;

    emit(event: 'dependency', dependency: Constructor | null, options: InjectOptions);
    emit(event: 'instantiated', dependency: Constructor | null, options: InjectOptions);
    emit(event: 'initialized', dependency: Constructor | null, options: InjectOptions);
    emit(event: 'mock',       depSpecifier: InjectedSpecifier, replace: InjectedSpecifier);
}

function validInjectOptions(options: InjectOptions) //{
{
    if(!!options.factory && !!options.object) {
        throw new Error(`invlaid dependency injection options: at most one of option in 'factory', 'object' be provided`);
    }

    if(!options.object && !options.paramtypes) {
        throw new Error(`dependency with factory and constructor must specify 'paramtypes'`);
    }

    let u = 0;
    if(!options.lazy) u++;
    if(options.initOnDeps) u++;
    if(options.initOnDepsInstantiated) u++;
    if(options.initOnDepsInited) u++;
    if(u > 1) {
        throw new Error(`options conflict, at most one of options in 'lazy: false', 'initOnDeps', 'initOnDepsInstantiated', 'initOnDepsInited' can be specified`);
    }
} //}
function makeid(length: number): string //{
{
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ )
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
} //}

type GetterOptions = {
    dynamic?: boolean,
    immediate?: boolean,
};

export class DependencyInjector extends EventEmitter {
    private readonly sym_inject: symbol;
    private readonly sym_initcallback_ref: symbol;
    private readonly idx2paramtypes: {[key: number]: InjectedSpecifier[]};
    private readonly idx2object: {[key: number]: object};
    private readonly idx2factory: {[key: number]: ObjectFactory};
    private readonly idx2initcallback: {[key: number]: (obj: any) => Promise<void>};
    private readonly idx2dependencyname: {[key: number]: string};
    private readonly idx2options: {[key: number]: InjectOptions};
    private readonly idx2constructor: {[key: number]: Constructor};
    private readonly idx2isinited: {[key: number]: boolean};

    private readonly name2idx: {[name: string]: number};
    private readonly promises: (() => Promise<void>)[];
    private injectableCounter: number;

    constructor() {
        super();
        this.sym_inject = Symbol('inject');
        this.sym_initcallback_ref = Symbol('init-ref');
        this.idx2paramtypes = {};
        this.idx2object = {};
        this.idx2factory = {};
        this.idx2initcallback = {};
        this.idx2dependencyname = {};
        this.idx2options = {};
        this.idx2constructor = {};
        this.idx2isinited = {};

        this.name2idx = {};
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

    /** method decrator */
    InjectableFactory<T extends Constructor>(specifier: T, options?: InjectOptions) //{
    {
        const ans = function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            options = options || {};
            options.paramtypes = options.paramtypes || 
                Reflect.getMetadata('design:paramtypes', target, propertyKey) ||
                [];
            options.factory = descriptor.value;
            this.ProvideDependency(specifier, options);
        }
        return ans.bind(this);
    } //}

    private assertInjectable<T extends Constructor>(target: T) //{
    {
        assert(target[this.sym_inject] != null, "require an injectable class");
    } //}

    private assertValidName(name: string) //{
    {
        assert(this.name2idx[name] >= 0, "require a valid dependency name");
    } //}
    
    private isValidSpecifier<T extends Constructor | string>(specifier: T): boolean //{
    {
        if(typeof specifier === 'function') {
            return typeof specifier[this.sym_inject] === 'number';
        } else if(typeof specifier === 'string') {
            return typeof this.name2idx[specifier] === 'number';
        } else {
            return false;
        }
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
            injectPoint = this.name2idx[specifier];
        }

        assert(injectPoint >= 0, 'dependency not found');

        if(this.idx2object[injectPoint] === undefined) {
            this.instantiateInject(injectPoint);
        }
        return this.idx2object[injectPoint] as any;
    } //}

    /** async query dependency */
    async AsyncQueryDependency<T extends Constructor | string>(specifier: T): Promise<T extends Constructor ? InstanceType<T> : any> //{
    {
        const ans = this.QueryDependency(specifier);
        await this.ResolveInitPromises();
        return ans;
    } //}

    /** get valid injection index from injection specifier */
    private idxFrom<T extends Constructor | string>(specifier: T): number //{
    {
        let ans: number;

        if(typeof specifier === 'function') {
            this.assertInjectable(specifier as T & Constructor);
            ans = specifier[this.sym_inject];
        } else {
            assert(typeof specifier === 'string', "dependency specifier should be a class or identifier");
            ans = this.name2idx[specifier];
        }

        if(ans == null || ans < 0) {
            throw new Error('bad injection index');
        }

        return ans;
    } //}

    /** mock dependency */
    MockDependency<T extends Constructor | string>(dep: T, replacer: T, injectOptions?: InjectOptions) //{
    {
        const options = Object.assign({}, injectOptions);

        if(!this.isValidSpecifier(replacer)) {
            if(!options.name && !replacer) {
                options.name = makeid(48);
            }
            this.ProvideDependency(replacer as any, options);
        }

        const dep_idx = this.idxFrom(dep);
        const rep_idx = this.idxFrom(replacer || options.name);

        if(typeof dep === 'function') {
            dep[this.sym_inject] = rep_idx;
        } else {
            this.name2idx[dep as string] = rep_idx;
        }
        this.emit("mock", dep, replacer || options.name);
    } //}

    /** provide dependency with varying methods */
    ProvideDependency<T extends Constructor>(provider: T | null, options?: InjectOptions) //{
    {
        options = Object.assign({lazy: true}, options);
        validInjectOptions(options);
        assert(provider || options.name, "dependency should provide at least one specifier");

        let factory: ObjectFactory;
        if(options.factory != null) {
            factory = options.factory;
        } else if (options.object !== undefined) {
            const obj = options.object;
            factory = () => obj;
            options.paramtypes = [];
            options.lazy = false;
        } else {
            assert(options.paramtypes !== undefined, "invalid dependency");
            assert(typeof provider === 'function', "invalid dependency injection specifier, expect a class");
            factory = (...args: any[]) => new provider(...args);
        }

        this.ProvideDependencyWithFactory(provider, factory, options);
    } //}

    /** provide dependency with object factory */
    private ProvideDependencyWithFactory<T extends Constructor>(provider: T, factory: ObjectFactory, options: InjectOptions) //{
    {
        assert(provider == null || provider[this.sym_inject] === undefined, "A class can't be provided twice");
        assert(typeof options.paramtypes === 'object', "provider should provide paramtypes");

        const injectPoint = this.injectableCounter++;
        if(!!provider) {
            provider[this.sym_inject] = injectPoint;
            this.idx2dependencyname[injectPoint] = `Class ${provider.name}`;
        }
        this.idx2factory[injectPoint] = factory;
        this.idx2paramtypes[injectPoint] = options.paramtypes;
        this.idx2options[injectPoint] = options;
        this.idx2constructor[injectPoint] = provider;

        if(!!options.afterInit) {
            this.idx2initcallback[injectPoint] = options.afterInit;
        }

        this.emit("dependency", provider, options);
        this.HandleOptionsWithInjectCounter(injectPoint, options);
    } //}

    /** handle options with inject counter */
    private HandleOptionsWithInjectCounter(injectPoint: number, options: InjectOptions) //{
    {
        if(options.name) {
            assert(this.name2idx[options.name] === undefined, "Defining a named dependency twice is invalid");
            this.name2idx[options.name] = injectPoint;

            if(this.idx2dependencyname[injectPoint]) {
                this.idx2dependencyname[injectPoint] += ` and ${options.name}`;
            } else {
                this.idx2dependencyname[injectPoint] += `${options.name}`;
            }
        }

        let justInit = false;
        const cons = this.idx2constructor[injectPoint];
        if(options.initOnDeps && options.initOnDeps.length > 0) {
            const deps = options.initOnDeps;
            for(const dep of deps) {
                if(this.isValidSpecifier(dep)) {
                    justInit = true;
                    break;
                }
            }

            if(!justInit) {
                const initializer = (dep: Constructor, options: InjectOptions) => {
                    if(deps.indexOf(dep) >= 0 || deps.indexOf(options.name) >= 0) {
                        this.removeListener("dependency", initializer);
                        this.QueryDependency(cons || options.name);
                    }
                }
                this.on("dependency", initializer);
            }
        }

        if(options.initOnDepsInstantiated && options.initOnDepsInstantiated.length > 0) {
            const deps = options.initOnDepsInstantiated;
            for(const dep of deps) {
                const idx = this.idxFrom(dep);
                if(this.idx2object[idx] !== undefined) {
                    justInit = true;
                    break;
                }
            }

            if(!justInit) {
                const initializer = (dep: Constructor, options: InjectOptions) => {
                    if(deps.indexOf(dep) >= 0 || deps.indexOf(options.name) >= 0) {
                        this.removeListener("instantiated", initializer);
                        this.QueryDependency(cons || options.name);
                    }
                }
                this.on("instantiated", initializer);
            }
        }

        if(options.initOnDepsInited && options.initOnDepsInited.length > 0) {
            const deps = options.initOnDepsInited;
            for(const dep of deps) {
                const idx = this.idxFrom(dep);
                if(this.idx2object[idx] !== undefined) {
                    justInit = true;
                    break;
                }
            }

            if(!justInit) {
                const initializer = (dep: Constructor, options: InjectOptions) => {
                    if(deps.indexOf(dep) >= 0 || deps.indexOf(options.name) >= 0) {
                        this.removeListener("initialized", initializer);
                        this.QueryDependency(cons || options.name);
                    }
                }
                this.on("initialized", initializer);
            }
        }

        if(justInit || (!options.lazy && this.idx2object[injectPoint] === undefined)) {
            this.instantiateInject(injectPoint);
        }
    } //}

    /** instantiate object with class */
    private instantiateInject(injectPoint: number) //{
    {
        assert(typeof injectPoint === 'number' && injectPoint >= 0, `invalid dependency ${injectPoint}`);
        assert(this.idx2object[injectPoint] === undefined, "Instantiating a provider twice is illegal");
        assert(typeof this.idx2factory[injectPoint] === 'function', "invalid injectable index");

        const factory = this.idx2factory[injectPoint];
        const args: any[] = [];
        const args_type = this.idx2paramtypes[injectPoint];
        for(const thet of args_type) {
            let di;
            if(typeof thet === 'function') {       // constructor
                di = thet[this.sym_inject];
            } else if (typeof thet === 'string') { // object
                di = this.name2idx[thet];
            }

            if(di == null) {
                console.debug(this);
                const dep_name = this.idx2dependencyname[injectPoint];
                throw new Error(`Denpendency error, can't find '${thet.toString()}' when initialize ${dep_name}`);
            }
            if(this.idx2object[di] === undefined) {
                this.instantiateInject(di);
            }
            args.push(this.idx2object[di]);
        }

        this.idx2object[injectPoint] = factory(...args);
        if(!!this.idx2initcallback[injectPoint]) {
            const cb = this.idx2initcallback[injectPoint];
            const cbb = async () => await cb(this.idx2object[injectPoint]);
            cbb[this.sym_initcallback_ref] = injectPoint;
            this.promises.push(cbb);
            this.runInitCalls().catch(err => { throw err; });
        } else {
            this.idx2isinited[injectPoint] = true;
        }
        const cons    = this.idx2constructor[injectPoint];
        const options = this.idx2options[injectPoint];
        this.emit("instantiated", cons, options);
    } //}

    private async runInitCalls() //{
    {
        if(this.initrunning) return;
        this.initrunning = true;

        while(this.promises.length > 0) {
            const cb = this.promises.shift();
            await cb();
            const idx = cb[this.sym_initcallback_ref];
            assert(idx != null);

            this.idx2isinited[idx] = true;
            const cons = this.idx2constructor[idx];
            const opts = this.idx2options[idx];
            this.emit("initialized", cons, opts);
        }

        this.initrunning = false;
        if(!!this.waiting_resolve) {
            this.waiting_resolve();
            this.waiting_resolve = null;
        }
    } //}

    private initrunning: boolean = false;
    private waiting_resolve: () => void;
    async ResolveInitPromises() //{
    {
        if(this.initrunning) {
            return await new Promise((resolve) => {
                this.waiting_resolve = resolve;
            });
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
        assert(this.isValidSpecifier(specifier), `unexpected specifier ${specifier}`);
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
        let getted = false;
        let staticObj;

        descriptor.get = () => {
            if(dynamic) {
                return this.QueryDependency(specifier);
            } else {
                if(!getted) {
                    getted = true;
                    staticObj = this.QueryDependency(specifier);
                }
                return staticObj;
            }
        }

        if(options.immediate) {
            descriptor.get();
        }

        descriptor.set = () => {
            throw new Error("setter of a DI property is prohibited");
        }
    } //}
}

export const GlobalInjector = new DependencyInjector();
export function Injectable(options?: InjectOptions) //{
{
    return GlobalInjector.Injectable(options);
} //}
export function InjectableFactory<T extends Constructor>(specifier: T, options?: InjectOptions) //{
{
    return GlobalInjector.InjectableFactory(specifier, options);
} //}
export function QueryDependency<T extends Constructor | string>(specifier: T): T extends Constructor ? InstanceType<T> : any //{
{
    return GlobalInjector.QueryDependency(specifier);
} //}
export function MockDependency<T extends Constructor>(dep: T | string, replacer: T | string, options?: {}) //{
{
    return GlobalInjector.MockDependency(dep, replacer, options);
} //}
export function ProvideDependency<T extends Constructor>(provider: T | null, options?: InjectOptions) //{
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

