'use client';

import {loadStripe} from '@stripe/stripe-js';
import {Alert, Button, Paper, Stack} from '@mui/material';
import React, {useState} from 'react';
import type {AlertColor} from '@mui/material/Alert';
import {FeeType} from "@types";
import {logClientError} from '@util/logActions';

interface CheckoutProps {
    title?: string,
    stripePublishableKey: string,
    feeType: FeeType
    feeText: string,
    buttonText: string,
    disabled?: boolean,
    // When provided, checkout will use the public, email-based API route
    publicEmail?: string
}

export default function Checkout({
                                     title = "Checkout",
                                     stripePublishableKey, feeType,
                                     buttonText,
                                     feeText,
                                     disabled,
                                     publicEmail
                                 }: CheckoutProps) {
    const [message, setMessage] = useState<[AlertColor, string]>(['info', feeText]);

    const handleCheckout = async () => {
        setMessage(['info', "Redirecting to Stripe's checkout page..."]);
        try {
            const stripePromise = loadStripe(stripePublishableKey);
            const stripe = await stripePromise;
            if (!stripe) throw new Error('Invalid stripe instance');
            const endpoint = publicEmail
                ? `/api/checkout-sessions-public/${feeType}`
                : `/api/checkout-sessions/${feeType}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originUrl: window.location.origin,
                    email: publicEmail,
                }),
            });
            let payload: {sessionId?: string; message?: string} = {};
            try {
                payload = await response.json();
            } catch {
                payload = {message: `Checkout failed (${response.status})`};
            }
            if (response.status !== 200) {
                const statusMessage = payload.message || `Checkout failed (${response.status})`;
                setMessage(['error', statusMessage]);
                await logClientError(
                    `Checkout ${feeType} failed: ${statusMessage}`,
                    {email: publicEmail, feeType}
                );
                return;
            }
            if (!payload.sessionId) {
                throw new Error('Checkout did not return a session id');
            }
            await stripe.redirectToCheckout({sessionId: payload.sessionId});
        } catch (error) {
            const statusMessage = error instanceof Error ? error.message : 'Checkout failed. Please try again.';
            setMessage(['error', statusMessage]);
            await logClientError(
                `Checkout ${feeType} exception: ${statusMessage}`,
                {email: publicEmail, feeType}
            );
        }
    };

    return (
        <Paper elevation={3}>
            <Stack spacing={2} padding={2}>
                <h1>{title}</h1>
                {message && message[1] && (
                    <Alert severity={message[0]}>
                        {message[1]}
                    </Alert>
                )}
                <Button
                    disabled={disabled}
                    variant="outlined"
                    onClick={!disabled ? handleCheckout : undefined}
                >
                    {buttonText}
                </Button>
            </Stack>
        </Paper>
    );
}
