import {test, expect} from '@playwright/experimental-ct-react';
import {FeaturedArtworkSlideshow} from '@components/Info/FeaturedArtworkSlideshow';
import {FeaturedPhotosAdmin} from '@components/Admin/FeaturedPhotosAdmin';
import {getFeaturedQueueSummary} from '@util/featuredStatus';

const items = [
    {
        id: 1,
        title: 'River Light',
        description: 'Oil on canvas from last year\'s booth.',
        url: '/img/Gates-of-Gordonston-B-W.jpg',
        width: 800,
        height: 600,
        artistName: 'Ada Painter',
    },
    {
        id: 2,
        title: 'Garden Gate',
        description: 'Watercolor of the Gordonston gates.',
        url: '/img/Gordonston-pathway.jpg',
        width: 800,
        height: 600,
        artistName: 'Ben Potter',
    },
];

test.describe('Featured artwork slideshow', () => {
    test('names last year\'s fair and shows each description', async ({mount, page}) => {
        await mount(
            <FeaturedArtworkSlideshow items={items} lastFairYear={2026} />
        );

        await expect(page.getByRole('heading', {name: /Artwork from the 2026 Gordonston Art Fair/i})).toBeVisible();
        await expect(page.getByText('Oil on canvas from last year\'s booth.')).toBeVisible();
        await expect(page.getByText('by Ada Painter')).toBeVisible();

        await page.getByRole('button', {name: 'Next artwork'}).click();
        await expect(page.getByText('Watercolor of the Gordonston gates.')).toBeVisible();
        await expect(page.getByText('by Ben Potter')).toBeVisible();
        await expect(page.getByText('Garden Gate')).toBeVisible();
    });

    test('renders nothing until an admin has approved a photo', async ({mount, page}) => {
        await mount(
            <FeaturedArtworkSlideshow items={[]} lastFairYear={2026} />
        );

        await expect(page.getByRole('heading', {name: /Artwork from the 2026 Gordonston Art Fair/i})).toHaveCount(0);
        await expect(page.getByText(/last year/i)).toHaveCount(0);
    });
});

test.describe('featured admin queue', () => {
    test('hides the front page until the first approval', () => {
        const empty = getFeaturedQueueSummary(2, 0, 1);
        expect(empty.frontPageLive).toBe(false);
        expect(empty.frontPageLabel).toMatch(/Nothing is showing on the front page yet/);
        expect(empty.pendingCount).toBe(2);
        expect(empty.approvedCount).toBe(0);
        expect(empty.declinedCount).toBe(1);

        const live = getFeaturedQueueSummary(0, 1, 0);
        expect(live.frontPageLive).toBe(true);
        expect(live.frontPageLabel).toMatch(/showing 1 photo/);
    });

    test('tells admins this is a new artist-requested feature', async ({mount, page}) => {
        await mount(
            <FeaturedPhotosAdmin
                pending={[]}
                approved={[]}
                declined={[]}
                lastFairYear={2026}
                reviewFeaturedUpload={async () => ({message: 'ok'})}
            />
        );

        await expect(page.getByText(/This is a new feature/i)).toBeVisible();
        await expect(page.getByText(/artists want featured/i)).toBeVisible();
        await expect(page.getByText(/not a random selection/i)).toBeVisible();
        await expect(page.getByText(/Nothing is showing on the front page yet/i)).toBeVisible();
        await expect(page.getByText(/When you approve the first image, it will automatically appear/i)).toBeVisible();
        await expect(page.getByText('Approved (on the front page): 0')).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Declined: 0'})).toBeVisible();
    });

    test('shows pending and approved counts for artist-requested photos', async ({mount, page}) => {
        await mount(
            <FeaturedPhotosAdmin
                pending={[{
                    id: 11,
                    title: 'River Light',
                    description: 'Oil on canvas',
                    url: '/img/Gates-of-Gordonston-B-W.jpg',
                    width: 800,
                    height: 600,
                    artistName: 'Ada Painter',
                    userId: 7,
                    email: 'ada@example.com',
                    artistStatus: 'imported',
                    approved: false,
                    declined: false,
                    updatedAt: null,
                }]}
                approved={[{
                    id: 12,
                    title: 'Garden Gate',
                    description: 'Watercolor of the gates',
                    url: '/img/Gordonston-pathway.jpg',
                    width: 800,
                    height: 600,
                    artistName: 'Ben Potter',
                    userId: 8,
                    email: 'ben@example.com',
                    artistStatus: 'paid',
                    approved: true,
                    declined: false,
                    updatedAt: null,
                }]}
                declined={[]}
                lastFairYear={2026}
                reviewFeaturedUpload={async () => ({message: 'ok'})}
            />
        );

        await expect(page.getByText('Approved (on the front page): 1')).toBeVisible();
        await expect(page.getByText(/The front page slideshow is showing 1 photo/i)).toBeVisible();
        await expect(page.getByRole('button', {name: 'Approve for home page'})).toBeVisible();
        await expect(page.getByRole('button', {name: 'Decline request'})).toBeVisible();
        await expect(page.getByText('Ada Painter')).toBeVisible();
        await expect(page.getByText('Watercolor of the gates')).toBeVisible();
    });
});
