import Stripe from "stripe";
import process from "node:process";
import {UserModel} from "@util/models";
import {NextResponse} from "next/server";
import {FeeType} from "@types";
import {formatDate, getRegistrationOpenDate, getRegistrationPhase} from "@util/date";

const stripeSecretKey = `${process.env.TEST_MODE === 'false'
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST}`;
const stripe = new Stripe(stripeSecretKey, {
    // apiVersion: '2025-06-30.basil',
});
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}`;

export interface FeeMetaData {
    userID: number;
    feeType: FeeType
}

export async function handleCheckout(profileData: UserModel, feeType: FeeType) {
    if (feeType === 'registration') {
        const phase = getRegistrationPhase();
        if (phase === 'not-yet-open') {
            return NextResponse.json({
                message: `Application submission is not open yet. You can save your profile now; submissions open ${formatDate(getRegistrationOpenDate())}.`
            }, {status: 403});
        }
        if (phase === 'closed') {
            return NextResponse.json({
                message: 'Artist registration is closed for this year\'s event.'
            }, {status: 403});
        }
    }

    const lineItem = {
        price_data: {
            currency: 'usd',
            product_data: {
                name: 'Registration Fee',
                // images: [item.image],
            },
            unit_amount: -1, //  registrationFee * 100, // TODO: Price should be retrieved from db
        },
        quantity: 1,
    };
    switch (feeType) {
        case 'registration':
            lineItem.price_data.unit_amount = parseInt(`${process.env.NEXT_PUBLIC_REGISTRATION_FEE}`, 10) * 100;
            lineItem.price_data.product_data.name = 'Artist Registration Fee';
            break;
        case 'booth':
            lineItem.price_data.unit_amount = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_FEE}`, 10) * 100;
            lineItem.price_data.product_data.name = 'Artist Booth Fee';
            break;
        case 'booth-double':
            lineItem.price_data.unit_amount = parseInt(`${process.env.NEXT_PUBLIC_BOOTH_DOUBLE_FEE}`, 10) * 100;
            lineItem.price_data.product_data.name = 'Artist Double Booth Fee';
            break;
        default:
            return NextResponse.json({
                message: `Invalid fee type: ${feeType}`
            }, {status: 400});
    }
    const feeAmount = lineItem.price_data.unit_amount;
    if (!feeAmount || feeAmount < 0 || Number.isNaN(feeAmount)) {
        return NextResponse.json({
            message: 'Invalid fee amount'
        }, {status: 400});
    }
    const metadata: Stripe.MetadataParam = {
        userID: profileData.id,
        feeType
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        // payment_method_types: ['card'],
        line_items: [lineItem],
        payment_intent_data: {
            metadata,
        },
        metadata,
        mode: 'payment',
        success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/payment/failure`,
    };
    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({sessionId: stripeSession.id});
}