import {NextResponse} from 'next/server';
import {fetchProfileFromSession} from '@util/profileActions';
import {handleCheckout} from '@util/checkout';
import {FeeType} from '@types';
import {UnauthorizedError} from '@util/exception/httpError';

type Params = Promise<{ feeType: FeeType }>;

export async function POST(
    request: Request,
    {params}: { params: Params }
) {
    try {
        const profileData = await fetchProfileFromSession();
        const {feeType} = await params;
        return handleCheckout(profileData, feeType);
    } catch (error) {
        if (error instanceof UnauthorizedError || (error instanceof Error && /unauthorized/i.test(error.message))) {
            return NextResponse.json(
                {message: error instanceof Error ? error.message : 'Unauthorized'},
                {status: 401}
            );
        }
        throw error;
    }
}
