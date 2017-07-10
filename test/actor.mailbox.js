require('source-map-support').install();
const { assert } = require('chai');
const Rx = require('rxjs');
const { createSystem } = require('../');
const { TestScheduler } = require('rxjs');
const { SystemActor } = require('../dist/SystemActor');
const { System } = require('../dist/System');

it.only('an actor can implement switchMap for duplicate messages', function (done) {
    const system = createSystem();

    const Child = function (address, context) {

        function effect1 (stream) {
            return context.cleanupCancelledMessages(stream, 'effect-01', function(stream) {
                return stream
                    .switchMap(({action, respond}) => {
                        return Rx.Observable
                            .of(respond(action))
                            .delay(10)
                    });
            })
        }

        function effect2 (stream) {
            return System.ofType(stream, 'effect-shane')
                .map(({action, respond}) => {
                    return respond('shane')
                });
        }

        return {
            setupReceive(incomingMessageStream) {
                const effects = Rx.Observable.from([effect1, effect2])
                    .flatMap(fn => {
                        return fn(incomingMessageStream);
                    });

                return effects;
            },
        }
    };

    const actorRef = system.actorOf(Child, 'child-01');
    const calls = [];

    const one = actorRef
            .ask({type: 'effect-01', payload: '01'})
            .subscribe(
                x => console.log('1 next', x),
                x => console.log('1 error', x),
                x => calls.push('1 complete')
            );

    const two = actorRef
            .ask({type: 'effect-01', payload: '02'})
            .subscribe(
                x => console.log('2 next', x),
                x => console.log('2 error', x),
                x => calls.push('2 complete')
            );

    const three = actorRef
            .ask({type: 'effect-01', payload: '03'})
            .subscribe(
                x => calls.push('3 next'),
                x => console.log('3 error', x),
                x => {
                    calls.push('3 complete');
                    assert.deepEqual(calls, [
                        '1 complete',
                        '2 complete',
                        '3 next',
                        '3 complete',
                    ]);
                    done();
                }
            );
    // Rx.Observable.merge(
    //     actorRef.ask({type: 'effect-01', payload: 1}),
    //     actorRef.ask({type: 'effect-01', payload: 2}),
    //     actorRef.ask({type: 'effect-01', payload: 3}),
    //     actorRef.ask({type: 'effect-01', payload: 4}),
    //     actorRef.ask({type: 'effect-01', payload: 5})
    // )
    //     .subscribe(x => {
    //         assert.deepEqual(x, {type: 'effect-01', payload: 5});
    //         done();
    //     });
});