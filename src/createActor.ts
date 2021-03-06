import {Observable, Subject} from "rxjs";
import {IActorContext} from "./ActorContext";
import {IMailbox, MailboxType} from "./getMailbox";
import {Effect} from "./System";
import {IActorRef, IncomingMessage, IOutgoingResponseFromStream, StreamHandler} from "./types";

export function createActor(factory: any, address: string, context: IActorContext): IActor {
    return new factory(address, context);
}

export interface IActorFactoryReturn {
    receive?: IActor["receive"];
    methods?: {[methodName: string]: StreamHandler};
}

export interface IActor {
    type: string;
    _responses?: Observable<any>;
    address: string;
    mailbox: IMailbox;
    patterns?: string[];
    methods?: {[methodName: string]: StreamHandler};
    initialState?: any;
    getInitialState?: any;
    _factoryMethod?: any;
    receive?(name: string, payload: any, respond: (response: any) => void, sender?: IActorRef): void;
    setupReceive?(mailbox: Subject<IncomingMessage>): Observable<IOutgoingResponseFromStream>;
    postStart?(): void;
    preStart?(): void;
    preRestart?(): void;
    postRestart?(): void;
}

export interface IncomingActor {
    name?: string;
    methods?: {[methodName: string]: StreamHandler};
}

export interface IStateActor {
    type: string;
    address: string;
    mailboxType: MailboxType;
    methods?: {[methodName: string]: StreamHandler};
    effects?: {[methodName: string]: Effect};
    missing?(payload: any, message: IncomingMessage): Observable<any>;
}

export interface IncomingStateActor {
    type: string;
    address: string;
    methods?: {[methodName: string]: StreamHandler};
    effects?: {[methodName: string]: Effect};
    missing?(payload: any, message: IncomingMessage): Observable<any>;
}
