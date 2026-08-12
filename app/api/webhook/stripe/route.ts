/* eslint-disable no-console */
import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {addTransaction} from '@util/transActions';
import {fetchProfileByID, updateUserStatus} from '@util/profileActions';
import {addUserUserLogModel} from "@util/logActions";
import {FeeMetaData} from "@util/checkout";
import {isRegistrationCheckoutAllowed} from '@util/date';

export async function POST(request: Request) {
    const body = await request.text();
    const sig = (await headers()).get('stripe-signature');

    if (!sig) {
        console.error('No stripe signature found');
        return NextResponse.json(
            {error: 'No stripe signature found'},
            {status: 400}
        );
    }

    let event;

    // Initialize Stripe with type checking for the secret key
    if (!process.env.STRIPE_SECRET_WEBHOOK_KEY) {
        throw new Error('STRIPE_SECRET_WEBHOOK_KEY is not defined');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_WEBHOOK_KEY);

    // Type check webhook secret
    if (!process.env.STRIPE_SECRET_WEBHOOK_KEY) {
        throw new Error('STRIPE_SECRET_WEBHOOK_KEY is not defined');
    }

    const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error verifying webhook signature:', error);
        return NextResponse.json(
            {error: `Webhook Error: ${error}`},
            {status: 400}
        );
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            console.log('Checkout complete', event);
            // Handle successful payment
            break;
        // case 'charge.dispute.funds_reinstated':
        // case 'charge.dispute.funds_withdrawn':
        // case 'charge.refund.updated':
        // case 'charge.expired':
        // case 'charge.pending':
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
            console.log('STRIPE', amount / 100, event.type);
            await addTransaction(userID, event.type, amount / 100, name, email, phone, id, event.data.object);
            if (userID) {
                const profileInfo = await fetchProfileByID(userID);

                switch (feeType) {
                    case 'registration':
                        if (!isRegistrationCheckoutAllowed()) {
                            await addUserUserLogModel(
                                userID,
                                'error',
                                'Registration fee payment received while submissions are not open; status left unchanged'
                            );
                            console.error('Rejected early registration fee status update for user', userID);
                            break;
                        }
                        switch (profileInfo.status) {
                            case 'imported':
                            case 'registered':
                                await updateUserStatus(userID, 'submitted', 'Registration fee paid');
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
                            default:
                                await addUserUserLogModel(userID, 'error', 'Booth fee paid, but profile status is not approved');
                                break;
                        }
                        break;
                    default:
                        console.error('Invalid fee type:' + feeType);
                }
            } else {
                console.error('No userID passed back from stripe');
            }

            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({message: 'Webhook received'});
}
