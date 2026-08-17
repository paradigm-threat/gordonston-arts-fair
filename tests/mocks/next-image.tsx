import React from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
};

export default function Image({alt, fill, priority, sizes, ...props}: ImageProps) {
    void fill;
    void priority;
    void sizes;
    return <img alt={alt} {...props} />;
}
