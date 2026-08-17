import {Button, FormControl, InputLabel, MenuItem, Select} from '@mui/material';

export interface IPaginationLinks {
  pageCount: number,
  page: number,
  setPage: (page: number) => void
}

export function PaginationLinks(props: IPaginationLinks) {
  const {
    setPage,
    page = 1,
    pageCount = 1
  } = props;
  const safePageCount = Math.max(pageCount, 1);
  const pages = Array.from({length: safePageCount}, (_, index) => index + 1);

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <Button
        disabled={page <= 1}
        variant="outlined"
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <FormControl sx={{minWidth: 160}}>
        <InputLabel id="page-select-label">Page</InputLabel>
        <Select
          labelId="page-select-label"
          id="page-select"
          label="Page"
          value={String(Math.min(page, safePageCount))}
          onChange={(event) => setPage(Number(event.target.value))}
        >
          {pages.map((pageNumber) => (
            <MenuItem key={pageNumber} value={String(pageNumber)}>
              {`${pageNumber} of ${safePageCount}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        disabled={page >= safePageCount}
        variant="outlined"
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
