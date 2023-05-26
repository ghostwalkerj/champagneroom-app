import { TicketStatus } from '../models/ticket';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, send, spawn, } from 'xstate';
import { createShowMachine, } from './showMachine';
export const createTicketMachine = ({ ticketDocument, showDocument, showMachineOptions, }) => {
    const parentShowMachine = createShowMachine({
        showDocument,
        showMachineOptions,
    });
    /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBjA1mZBZAhugBaoB2YAxACoCSAwgNICiVAylQIJVMAEAqgAUAIlyYBtAAwBdRKAAOAe1io0C0rJAAPRABYATABoQAT0QBGABwBWHQDo9VgMx6dATlcB2F3sc6Avn5GaFg4BMRklKwAEgDyAOo8dBwAcnRMADLpTEKSMkggisqq6vnaCPpGpghmeha2VhKNEhauVgBsro0ejgFBGNh4hCTkFNHxiSlpmdliZnnySiqoahplFSaIjq5mtq2OZjoNVhYSjha9IMEDYcNgtlc46Qr4EJAUuRqFSyuliG2ntlONVcegkbS8ZjBlUQnis9hBtQknmanR6gUu-VCQwi90xyCeLzes3mBUWxVWiGOjkB+z0ILBEKhGwQ+x2bXaem6nLMnVcFg8Fweg3C5FxIXxz1eEHeehJX3JvwQXmhCE5OjatgsW1qjnZVksFn86KFNxxQoJUvejjlZOWJVAZX+1KBdNB4L0kLaKr0HtcgJakKc6osbXBgrxptF5slRJ0NqKdopCCsrmdtPp7s9KpsdXZbT0-wkOh0NQ8ZnD4sjd2jhOlYis8e+9q0lMMzMcEic9kc+s6EjMBzaFeu2KjeItRLajYVDspWppwLdjK9zJc7U1WyLblq7Vcw6xIruACc4GAjwA3SC2ADu+CWpCgOgE+GMAFswKRkBQBBwAJq4JhkioHgACUmDSGgADUZmkT5bR+WdqgcP1DlZbYJA8EszBVDx1x0Zx0JODsGnOY0I1HY9TwvK9b3vR9nzfD8vx-f9AOAsCIOgnI5jghMEJbaorAcQF82OCQfS2GoLBVUMPFsMwOUNEFULacsyMrCjbBPWAz0vCAbzvNAHyfF930-CgwIART4Jh2AmVIMnSLgaBiZIPnyeVE0VUEalsRxMNcNxDkOdppOZA510hdUDlTU4LBDfdhVuLSqL0gy6JMxjzKsmy7KSBzMmc1ziV4psk08OS6Q6HddSEnQVRqYTjm2Tl+VDJEh3UkdDxSnTqP02ijPo0ymPeWCPPg5syhqFNbFQgd0MwgccMhOaCP5ftAscLZEqrXrdJowyyEfVgiAUa8LKYazbOA-Kpic2hivGhY+KmxAfL0PyAqCmwrFChq2n2OazDLXDOx0DwMIFLqD2S7SDoGo7jNO87LuuvLJkcoq3J4ibXqTAceV2MEfHw8FXAas5PtdNUew6dxds0+H+vSoadBRi6ACkYhoZJsh4MY4ncl6yu8-tPv8oLAt+-7wvcOSvE8HsQc6As9xhpKcWZtKTwARwAVzgZBIDofBSHQMAABtLfwYpWeOnQQLAAAzfXSGlMCADE+GSIRQPApgoJg6cvMQj6vql4K-raMKqhmuxtpaQ0PTpRpOr6DSeu1q89cN2BjYgU3zatm27cGh2ndd93Lu933-c4mZcZFmcBLMQHPqLGPk-+Dx+SsBqXDqDwEUwun3HVjPurhsBIDAd9pSyT3gMF4XSXx7zh79DohKRD1xcw70Bw1M4Uw7NuKrRSfYa1mfXnnihud5-mV+etfRbD7o7E-jtXFDD1sNXOJCQa1OQYROB6QG6cMSZ2nrPe+gseCASEMHUqLdHRtiqKnBOuELAFkOLhAc0Mr6a1FGQJgsB0BHlRp7Jg2QABCHBGD10DlxVenl+JlC2NSMGpw2jqh8LhXU3oQxwm2iCDwkMSxVSgSaTSZCKFUIukIGgrABB8G4DwXmNBaCiByK-dhb0WSplsDw3U-D-JOBXFUM+dgeQhh0J2Voa5obolIAoV48B8iyMPKg0OAkAC0VjED+LhOPMJ4TcGtEZj1GsUpfEcN0NtExeZDg+hcN0VoDV+RyQhr-QGacfC1GidPPqel4mGO2HYKqIJrC1RcNmYetg8zISDBI7oxSb6lMOhlBiZlkDlIJl0XY1Tf5Fg9IaHCgV6iiQkfFJwBxSLEL2tnRGGUOYDMVL-amv8amWLqgDVoTS+TFjML4TsEiOmihWSlA2RsTZmwttbW2fiDEE2OHYTu8V9A9z7g1NuOwaY6BaO6Bxl9oFT06QjG5ecC5F0eaXO09tjKVzdhADZiEQbiSaQ4-4Phf4gxDJTDwGo7HtG6CDNpizwXXyubfOekB0UCR8BYNkSJnBbAcWy+qq4PRyTEQpBw-kqaXLuOgB5JcGV43fkyqR8l2gKWOPmGOEiAZt2JuCfUxFpYyPIj1Z2ZB8CW1QAAL0lc3PxjpTm7ENOqXw+oOSOGEVYHJPYUzOu3r4EVth5GUPOoysonJqT-FTN0dkbgywU3bFubsQk-qnPBBInVMCcRkCEKgWAch9bG39ZSTwTSI2cnZAtY4KpnCNHkkWX+21xJajRAEIAA */
    return createMachine({
        context: {
            ticketDocument,
            showDocument,
            ticketState: JSON.parse(JSON.stringify(ticketDocument.ticketState)),
            errorMessage: undefined,
            id: nanoid(),
            showMachineRef: undefined,
        },
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        tsTypes: {},
        schema: {
            events: {},
        },
        predictableActionArguments: true,
        id: 'ticketMachine',
        initial: 'ticketLoaded',
        entry: assign(() => {
            const showMachineRef = spawn(parentShowMachine, {
                name: 'showMachineService',
                sync: true,
            });
            return { showMachineRef };
        }),
        states: {
            ticketLoaded: {
                always: [
                    {
                        target: 'reserved',
                        cond: 'ticketReserved',
                    },
                    {
                        target: 'cancelled',
                        cond: 'ticketCancelled',
                    },
                    {
                        target: 'finalized',
                        cond: 'ticketFinalized',
                    },
                    {
                        target: 'reedemed',
                        cond: 'ticketReedemed',
                    },
                    {
                        target: '#ticketMachine.reserved.initiatedCancellation',
                        cond: 'ticketInCancellationInitiated',
                    },
                    {
                        target: '#ticketMachine.ended.inEscrow',
                        cond: 'ticketInEscrow',
                    },
                    {
                        target: '#ticketMachine.ended.inDispute',
                        cond: 'ticketInDispute',
                    },
                    {
                        target: '#ticketMachine.ended.missedShow',
                        cond: 'ticketMissedShow',
                    },
                ],
            },
            reserved: {
                initial: 'waiting4Payment',
                states: {
                    waiting4Payment: {
                        always: [
                            {
                                target: 'waiting4Show',
                                cond: 'fullyPaid',
                            },
                        ],
                        on: {
                            'PAYMENT RECEIVED': [
                                {
                                    target: 'waiting4Show',
                                    cond: 'fullyPaid',
                                    actions: ['receivePayment', 'sendTicketSold'],
                                },
                                {
                                    actions: ['receivePayment'],
                                },
                            ],
                            'CANCELLATION INITIATED': [
                                {
                                    target: '#ticketMachine.cancelled',
                                    cond: 'canCancel',
                                    actions: [
                                        'initiateCancellation',
                                        'cancelTicket',
                                        'sendTicketCancelled',
                                    ],
                                },
                                {
                                    target: 'initiatedCancellation',
                                    actions: ['initiateCancellation'],
                                },
                            ],
                        },
                    },
                    waiting4Show: {
                        on: {
                            'JOINED SHOW': {
                                target: '#ticketMachine.reedemed',
                                cond: 'canWatchShow',
                                actions: ['redeemTicket', 'sendJoinedShow'],
                            },
                        },
                    },
                    initiatedCancellation: {
                        initial: 'waiting4Refund',
                        states: {
                            waiting4Refund: {
                                on: {
                                    'REFUND RECEIVED': [
                                        {
                                            target: '#ticketMachine.cancelled',
                                            cond: 'fullyRefunded',
                                            actions: [
                                                'receiveRefund',
                                                'cancelTicket',
                                                'sendTicketRefunded',
                                                'sendTicketCancelled',
                                            ],
                                        },
                                        {
                                            actions: ['receiveRefund'],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                on: {
                    'SHOW ENDED': {
                        target: '#ticketMachine.ended.missedShow',
                        actions: ['missShow'],
                    },
                },
            },
            reedemed: {
                on: {
                    'LEFT SHOW': { actions: ['sendLeftShow'] },
                    'JOINED SHOW': {
                        cond: 'canWatchShow',
                        actions: ['sendJoinedShow'],
                    },
                    'SHOW ENDED': {
                        target: '#ticketMachine.ended',
                        actions: ['enterEscrow'],
                    },
                },
            },
            cancelled: {
                type: 'final',
                entry: ['deactivateTicket'],
            },
            finalized: {
                type: 'final',
                entry: ['deactivateTicket'],
            },
            ended: {
                initial: 'inEscrow',
                states: {
                    inEscrow: {
                        on: {
                            'FEEDBACK RECEIVED': {
                                target: '#ticketMachine.finalized',
                                actions: ['receiveFeedback', 'finalizeTicket'],
                            },
                            'DISPUTE INITIATED': {
                                target: 'inDispute',
                                actions: ['initiateDispute'],
                            },
                        },
                    },
                    inDispute: {},
                    missedShow: {},
                },
            },
        },
        on: {
            'SHOW CANCELLED': [
                {
                    target: '#ticketMachine.cancelled',
                    cond: 'canCancel',
                    actions: [
                        'initiateCancellation',
                        'cancelTicket',
                        'sendTicketCancelled',
                    ],
                },
                {
                    target: '#ticketMachine.reserved.initiatedCancellation',
                    actions: ['initiateCancellation'],
                },
            ],
        },
    }, {
        actions: {
            sendJoinedShow: send((context) => ({
                type: 'CUSTOMER JOINED',
                ticket: context.ticketDocument,
            }), { to: (context) => context.showMachineRef }),
            sendLeftShow: send((context) => ({
                type: 'CUSTOMER LEFT',
                ticket: context.ticketDocument,
            }), { to: (context) => context.showMachineRef }),
            sendTicketSold: send((context) => ({
                type: 'TICKET SOLD',
                ticket: context.ticketDocument,
                soldAt: context.ticketState.sale?.soldAt,
                transactions: context.ticketState.sale?.transactions,
                amount: context.ticketState.sale?.amount,
            }), { to: (context) => context.showMachineRef }),
            sendTicketRefunded: send((context) => ({
                type: 'TICKET REFUNDED',
                ticket: context.ticketDocument,
                refundedAt: context.ticketState.refund?.refundedAt,
                transactions: context.ticketState.refund?.transactions,
                amount: context.ticketState.refund?.amount,
            }), { to: (context) => context.showMachineRef }),
            sendTicketCancelled: send((context) => ({
                type: 'TICKET CANCELLED',
                ticket: context.ticketDocument,
            }), { to: (context) => context.showMachineRef }),
            initiateCancellation: assign((context, event) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.CANCELLATION_INITIATED,
                        cancel: event.cancel,
                    },
                };
            }),
            redeemTicket: assign((context) => {
                if (context.ticketState.status === TicketStatus.REDEEMED)
                    return {};
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.REDEEMED,
                        redemption: {
                            redeemedAt: new Date(),
                        },
                    },
                };
            }),
            cancelTicket: assign((context) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.CANCELLED,
                    },
                };
            }),
            receivePayment: assign((context, event) => {
                const sale = context.ticketState.sale || {
                    soldAt: new Date(),
                    transactions: [],
                    amount: 0,
                };
                sale.amount += +event.transaction.value;
                sale.transactions.push(event.transaction._id);
                return {
                    ticketState: {
                        ...context.ticketState,
                        totalPaid: context.ticketState.totalPaid + +event.transaction.value,
                        sale,
                    },
                };
            }),
            receiveRefund: assign((context, event) => {
                const state = context.ticketState;
                const refund = state.refund || {
                    refundedAt: new Date(),
                    transactions: [],
                    amount: 0,
                };
                refund.amount += +event.transaction.value;
                refund.transactions.push(event.transaction._id);
                return {
                    ticketState: {
                        ...context.ticketState,
                        refundedAmount: context.ticketState.totalRefunded + +event.transaction.value,
                        refund,
                    },
                };
            }),
            receiveFeedback: assign((context, event) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        feedback: event.feedback,
                    },
                };
            }),
            initiateDispute: assign((context, event) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.IN_DISPUTE,
                        dispute: event.dispute,
                    },
                };
            }),
            enterEscrow: assign((context) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.IN_ESCROW,
                        escrow: {
                            ...context.ticketState.escrow,
                            startedAt: new Date(),
                        },
                    },
                };
            }),
            finalizeTicket: assign((context) => {
                const finalized = {
                    finalizedAt: new Date(),
                };
                if (context.ticketState.status !== TicketStatus.FINALIZED) {
                    return {
                        ticketState: {
                            ...context.ticketState,
                            finalized: finalized,
                            status: TicketStatus.FINALIZED,
                        },
                    };
                }
                return {};
            }),
            deactivateTicket: assign((context) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        active: false,
                    },
                };
            }),
            missShow: assign((context) => {
                return {
                    ticketState: {
                        ...context.ticketState,
                        status: TicketStatus.MISSED_SHOW,
                    },
                };
            }),
        },
        guards: {
            canCancel: (context) => {
                const canCancel = context.ticketState.totalPaid <= context.ticketState.totalRefunded;
                return canCancel;
            },
            ticketCancelled: (context) => context.ticketState.status === TicketStatus.CANCELLED,
            ticketFinalized: (context) => context.ticketState.status === TicketStatus.FINALIZED,
            ticketInDispute: (context) => context.ticketState.status === TicketStatus.IN_DISPUTE,
            ticketInEscrow: (context) => context.ticketState.status === TicketStatus.IN_ESCROW,
            ticketReserved: (context) => context.ticketState.status === TicketStatus.RESERVED,
            ticketReedemed: (context) => context.ticketState.status === TicketStatus.REDEEMED,
            ticketInCancellationInitiated: (context) => context.ticketState.status === TicketStatus.CANCELLATION_INITIATED,
            ticketMissedShow: (context) => context.ticketState.status === TicketStatus.MISSED_SHOW,
            fullyPaid: (context, event) => {
                const value = event.type === 'PAYMENT RECEIVED' ? event.transaction?.value : 0;
                return (context.ticketState.totalPaid + +value >=
                    context.ticketDocument.price);
            },
            fullyRefunded: (context, event) => {
                const value = event.type === 'REFUND RECEIVED' ? event.transaction?.value : 0;
                return (context.ticketState.totalRefunded + +value >=
                    context.ticketState.totalPaid);
            },
            canWatchShow: (context) => {
                const state = context.showMachineRef?.getSnapshot();
                return (state !== undefined &&
                    context.ticketState.totalPaid >= context.ticketDocument.price &&
                    state.matches('started'));
            },
        },
    });
};
export const createTicketMachineService = ({ ticketDocument, ticketMachineOptions, showDocument, showMachineOptions, }) => {
    const ticketMachine = createTicketMachine({
        ticketDocument,
        ticketMachineOptions,
        showDocument,
        showMachineOptions,
    });
    const ticketService = interpret(ticketMachine).start();
    if (ticketMachineOptions?.saveStateCallback) {
        ticketService.onChange((context) => {
            ticketMachineOptions.saveStateCallback &&
                ticketMachineOptions.saveStateCallback(context.ticketState);
        });
    }
    const showService = ticketService.getSnapshot().children['showMachineService'];
    if (showMachineOptions?.saveStateCallback) {
        showService.onChange((context) => {
            showMachineOptions.saveStateCallback &&
                showMachineOptions.saveStateCallback(context.showState);
        });
    }
    if (showMachineOptions?.saveShowEventCallback) {
        showService.onEvent((event) => {
            const ticket = ('ticket' in event ? event.ticket : undefined);
            const transaction = ('transaction' in event ? event.transaction : undefined);
            showMachineOptions.saveShowEventCallback &&
                showMachineOptions.saveShowEventCallback({
                    type: event.type,
                    ticket,
                    transaction,
                });
        });
    }
    return ticketService;
};
