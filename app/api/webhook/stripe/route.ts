/* eslint-disable no-console */
import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {addTransaction} from '@util/transActions';
import {fetchProfileByID, updateUserStatus} from '@util/profileActions';
import {addUserUserLogModel} from "@util/logActions";
import {FeeMetaData} from "@util/checkout";
import {isRegistrationCheckoutAllowedForUser} from '@util/date';
import {appLog} from '@util/appLog';

export async function POST(request: Request) {
    const body = await request.text();
    const sig = (await headers()).get('stripe-signature');

    if (!sig) {
        appLog('stripe.webhook.rejected', {reason: 'missing-signature'}, 'error');
        return NextResponse.json(
            {error: 'No stripe signature found'},
            {status: 400}
        );
    }

    let event;

    if (!process.env.STRIPE_SECRET_WEBHOOK_KEY) {
        throw new Error('STRIPE_SECRET_WEBHOOK_KEY is not defined');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_WEBHOOK_KEY);
    const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        appLog('stripe.webhook.rejected', {reason: 'bad-signature', error}, 'error');
        return NextResponse.json(
            {error: `Webhook Error: ${error}`},
            {status: 400}
        );
    }

    switch (event.type) {
        case 'checkout.session.completed':
            appLog('stripe.checkout.completed', {eventId: event.id});
            break;
        case 'charge.refunded':
        case 'charge.succeeded': {
            const {
                id,
                amount,
                metadata,
                billing_details: {
                    name,
                    email,
                    phone
                }
            } = event.data.object;
            const {
                userID,
                feeType
            } = metadata as unknown as FeeMetaData;
            appLog('stripe.charge', {
                type: event.type,
                amount: amount / 100,
                userID,
                feeType,
                providerId: id,
            });
            await addTransaction(userID, event.type, amount / 100, name, email, phone, id, event.data.object);
            if (userID) {
                const profileInfo = await fetchProfileByID(userID);

                switch (feeType) {
                    case 'registration':
                        if (!isRegistrationCheckoutAllowedForUser(profileInfo)) {
                            await addUserUserLogModel(
                                userID,
                                'error',
                                'Registration fee payment received while submissions are not open; status left unchanged'
                            );
                            appLog('stripe.status.skipped', {
                                userID,
                                feeType,
                                reason: 'registration-window',
                                status: profileInfo.status,
                            }, 'error');
                            break;
                        }
                        switch (profileInfo.status) {
                            case 'imported':
                            case 'registered':
                                await updateUserStatus(userID, 'submitted', 'Registration fee paid');
                                break;
                            case 'submitted':
                            case 'approved':
                            case 'standby':
                            case 'declined':
                            case 'paid':
                                appLog('stripe.status.idempotent', {
                                    userID,
                                    feeType,
                                    status: profileInfo.status,
                                });
                                break;
                            default:
                                await addUserUserLogModel(userID, 'error', 'Registration fee paid, but profile status is not imported or registered');
                                break;
                        }
                        break;
                    case 'booth-double':
                    case 'booth':
                        switch (profileInfo.status) {
                            case 'approved':
                                await updateUserStatus(userID, 'paid', 'Booth fee paid');
                                break;
                            case 'paid':
                                appLog('stripe.status.idempotent', {
                                    userID,
                                    feeType,
                                    status: profileInfo.status,
                                });
                                break;
                            default:
                                await addUserUserLogModel(userID, 'error', 'Booth fee paid, but profile status is not approved');
                                break;
                        }
                        break;
                    default:
                        appLog('stripe.charge.invalid_fee_type', {userID, feeType}, 'error');
                }
            } else {
                appLog('stripe.charge.missing_user', {providerId: id, feeType}, 'error');
            }

            break;
        }
        default:
            appLog('stripe.webhook.unhandled', {type: event.type});
    }

    return NextResponse.json({message: 'Webhook received'});
}
