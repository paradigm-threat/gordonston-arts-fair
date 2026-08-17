import Link from 'next/link';
import ReloadingImage from '@components/Image/ReloadingImage';
import {displayUploadTitle} from '@util/format';
import {UserFileUploadModel} from '@util/models';

export function UploadThumbnailGrid({
  uploads,
}: {
  uploads: UserFileUploadModel[];
}) {
  if (uploads.length === 0) {
    return <p>No photos uploaded yet.</p>;
  }

  return (
    <ul className="upload-grid">
      {uploads.map(({id, title, description, url, width, height}) => {
        const caption = displayUploadTitle(title);
        if (!url) return null;
        return (
          <li key={id || `${url}-${title}`}>
            <Link
              href={url}
              target="_blank"
              rel="noreferrer"
              className="upload-thumb-link"
            >
              <span className="upload-thumb">
                <ReloadingImage
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  src={url}
                  alt={description || caption}
                  className="upload-thumb-image"
                />
              </span>
              <span className="upload-thumb-caption">{caption}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
