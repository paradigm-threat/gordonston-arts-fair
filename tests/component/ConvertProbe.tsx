import React, {useEffect, useState} from 'react';
import {convertImageToJPG} from '@util/convertImg';

function hexPngFile(name: string) {
    const bytes = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    ), (ch) => ch.charCodeAt(0));
    return new File([bytes], name, {type: 'image/png'});
}

export function ConvertProbe() {
    const [text, setText] = useState('converting');
    useEffect(() => {
        convertImageToJPG(hexPngFile('studio.PNG'))
            .then((jpg) => {
                setText(`${jpg.name} ${jpg.type} ${jpg.size > 0 ? 'ok' : 'empty'}`);
            })
            .catch((error: unknown) => {
                setText(error instanceof Error ? error.message : 'convert failed');
            });
    }, []);
    return <div>{text}</div>;
}
