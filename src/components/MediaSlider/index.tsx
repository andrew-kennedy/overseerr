import ShowMoreCard from '@app/components/MediaSlider/ShowMoreCard';
import PersonCard from '@app/components/PersonCard';
import Slider from '@app/components/Slider';
import TitleCard from '@app/components/TitleCard';
import useSettings from '@app/hooks/useSettings';
import { ArrowCircleRightIcon } from '@heroicons/react/outline';
import { MediaStatus } from '@server/constants/media';
import type {
  MovieResult,
  PersonResult,
  TvResult,
} from '@server/models/Search';
import Link from 'next/link';
import { useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';

interface MixedResult {
  page: number;
  totalResults: number;
  totalPages: number;
  results: (TvResult | MovieResult | PersonResult)[];
}

interface MediaSliderProps {
  title: string;
  url: string;
  linkUrl?: string;
  sliderKey: string;
  hideWhenEmpty?: boolean;
}

const MediaSlider = ({
  title,
  url,
  linkUrl,
  sliderKey,
  hideWhenEmpty = false,
}: MediaSliderProps) => {
  const settings = useSettings();
  const { data, error, setSize, size } = useSWRInfinite<MixedResult>(
    (pageIndex: number, previousPageData: MixedResult | null) => {
      if (previousPageData && pageIndex + 1 > previousPageData.totalPages) {
        return null;
      }

      return `${url}?page=${pageIndex + 1}`;
    },
    {
      initialSize: 2,
    }
  );

  let titles = (data ?? []).reduce(
    (a, v) => [...a, ...v.results],
    [] as (MovieResult | TvResult | PersonResult)[]
  );

  if (
    settings.currentSettings.hideAvailable ||
    settings.currentSettings.hideRequested
  ) {
    titles = titles.filter(
      (i) =>
        i.mediaType === 'person' ||
        (i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE &&
          (!settings.currentSettings.hideRequested ||
            (i.mediaInfo?.status !== MediaStatus.PENDING &&
              i.mediaInfo?.status !== MediaStatus.PROCESSING)))
    );
  }

  useEffect(() => {
    if (
      titles.length < 24 &&
      size < 5 &&
      (data?.[0]?.totalResults ?? 0) > size * 20
    ) {
      setSize(size + 1);
    }
  }, [titles, setSize, size, data]);

  if (hideWhenEmpty && (data?.[0].results ?? []).length === 0) {
    return null;
  }

  const finalTitles = titles.slice(0, 20).map((title) => {
    switch (title.mediaType) {
      case 'movie':
        return (
          <TitleCard
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
            inProgress={(title.mediaInfo?.downloadStatus ?? []).length > 0}
          />
        );
      case 'tv':
        return (
          <TitleCard
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.name}
            userScore={title.voteAverage}
            year={title.firstAirDate}
            mediaType={title.mediaType}
            inProgress={(title.mediaInfo?.downloadStatus ?? []).length > 0}
          />
        );
      case 'person':
        return (
          <PersonCard
            personId={title.id}
            name={title.name}
            profilePath={title.profilePath}
          />
        );
    }
  });

  if (linkUrl && titles.length > 20) {
    finalTitles.push(
      <ShowMoreCard
        url={linkUrl}
        posters={titles
          .slice(20, 24)
          .map((title) =>
            title.mediaType !== 'person' ? title.posterPath : undefined
          )}
      />
    );
  }

  return (
    <>
      <div className="slider-header">
        {linkUrl ? (
          <Link href={linkUrl}>
            <a className="slider-title">
              <span>{title}</span>
              <ArrowCircleRightIcon />
            </a>
          </Link>
        ) : (
          <div className="slider-title">
            <span>{title}</span>
          </div>
        )}
      </div>
      <Slider
        sliderKey={sliderKey}
        isLoading={!data && !error}
        isEmpty={false}
        items={finalTitles}
      />
    </>
  );
};

export default MediaSlider;
