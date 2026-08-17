'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography
} from '@mui/material';
import type {AlertColor} from '@mui/material/Alert';
import Link from 'next/link';
import {getFullName, getStatusName} from '@util/profile';
import {MailResult, profileStatuses, UserSearchParams, UserStatus} from '@types';
import {IUserSearchResponse} from '@util/userActions';
import {PaginationLinks} from '@components/Pagination/PaginationLinks';
import styles from './UserListAdmin.module.css';
import {exportToExcel} from '@util/export';
import {BookType} from 'xlsx';
import {AdminSelect} from '@components/Admin/AdminSelect';

import Mail from 'nodemailer/lib/mailer';
import SendEmailAdmin from '@components/Admin/SendEmailAdmin';
import UserStatusEditorAdmin from '@components/Admin/UserStatusEditorAdmin';

interface AdminUserListProps {
    listUsersAsAdmin(args: UserSearchParams): Promise<IUserSearchResponse>,

    sendMail?(options: Mail.Options): Promise<MailResult>,

    updateUsersStatusBulk?(userIDs: number[], newStatus: UserStatus, sendTemplate?: boolean): Promise<{
        message: string
    }>,
}

const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';

const SORT_OPTIONS = [
    {value: 'last_name', label: 'Last name'},
    {value: 'email', label: 'Email'},
    {value: 'createdAt', label: 'Created'},
    {value: 'updatedAt', label: 'Updated'},
    {value: 'status', label: 'Status'},
];

const LIMIT_OPTIONS = [
    {value: '25', label: '25 per page'},
    {value: '50', label: '50 per page'},
    {value: '100', label: '100 per page'},
];

export default function UserListAdmin({
    listUsersAsAdmin,
    sendMail,
    updateUsersStatusBulk,
}: AdminUserListProps) {
    const sendMailSafe = sendMail || (async () => ({status: 'error', message: 'sendMail not provided' as const}));
    const updateUsersStatusBulkSafe = updateUsersStatusBulk || (async () => ({message: 'updateUsersStatusBulk not provided'}));
    const [status, setStatus] = useState<'ready' | 'loading'>('loading');
    const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
    const [data, setData] = useState<IUserSearchResponse>({
        userList: [],
        pageCount: 0,
        totalCount: 0
    });
    const {
        userList,
        pageCount,
    } = data;
    const [args, setArgs] = useState<UserSearchParams>({
        status: undefined,
        limit: 25,
        orderBy: 'updatedAt',
        order: 'desc'
    });
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectAllPending, setSelectAllPending] = useState(false);

    const allVisibleSelected = useMemo(() => {
        if (userList.length === 0) return false;
        return userList.every((user) => selectedIds.has(user.id));
    }, [userList, selectedIds]);

    const someVisibleSelected = useMemo(() => {
        return userList.some((user) => selectedIds.has(user.id)) && !allVisibleSelected;
    }, [userList, selectedIds, allVisibleSelected]);

    useEffect(() => {
        setMessage(['info', 'Fetching user logs...']);
        try {
            listUsersAsAdmin(args).then((resp) => {
                setData(resp);
                if (selectAllPending) {
                    setSelectedIds(new Set(resp.userList.map((user) => user.id)));
                    setSelectAllPending(false);
                }
            }).then(() => setStatus('ready'));
            setMessage(['info', '']);
        } catch (e: unknown) {
            setMessage(['error', (e as Error).message]);
        }
    }, [args, listUsersAsAdmin, selectAllPending]);

    async function exportData(bookType: BookType) {
        const exportedData = await listUsersAsAdmin({
            ...args,
            limit: 99999
        });
        exportToExcel(exportedData.userList, `export.${bookType}`, bookType);
    }

    function toggleSort(field: string) {
        setArgs({
            ...args,
            orderBy: field,
            order: args.orderBy === field && args.order === 'asc' ? 'desc' : 'asc',
            page: 1,
        });
    }

    function sortDirection(field: string): 'asc' | 'desc' | false {
        if (args.orderBy !== field) return false;
        return args.order === 'asc' ? 'asc' : 'desc';
    }

    const page = args.page || 1;
    const currentPageLabel = `Page ${page} of ${pageCount || 1} (${data.totalCount} ${USER_LABEL.toLowerCase()}${data.totalCount === 1 ? '' : 's'})`;

    return (
        <Box className="admin-panel">
            <Typography component="p" variant="body1">
                {currentPageLabel}
                {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''}
            </Typography>

            {message && message[1] && (
                <Alert severity={message[0]}>
                    {message[1]}
                </Alert>
            )}

            <div className="admin-toolbar">
                <TextField
                    label="Search"
                    placeholder="Name, email, company, phone"
                    value={args.search || ''}
                    onChange={(event) => setArgs({...args, search: event.target.value, page: 1})}
                />
                <AdminSelect
                    id="artist-status-filter"
                    label="Status"
                    value={args.status || 'all'}
                    onChange={(value) => setArgs({
                        ...args,
                        status: value === 'all' ? undefined : value,
                        page: 1,
                    })}
                    options={[
                        {value: 'all', label: 'All statuses'},
                        ...profileStatuses.map((value) => ({
                            value,
                            label: getStatusName(value),
                        })),
                    ]}
                />
                <AdminSelect
                    id="artist-sort-field"
                    label="Sort by"
                    value={args.orderBy || 'updatedAt'}
                    onChange={(value) => setArgs({...args, orderBy: value, page: 1})}
                    options={SORT_OPTIONS}
                />
                <AdminSelect
                    id="artist-sort-order"
                    label="Order"
                    value={args.order || 'desc'}
                    onChange={(value) => setArgs({
                        ...args,
                        order: value === 'asc' ? 'asc' : 'desc',
                    })}
                    options={[
                        {value: 'desc', label: 'Newest first'},
                        {value: 'asc', label: 'Oldest first'},
                    ]}
                />
                <AdminSelect
                    id="artist-page-size"
                    label="Show"
                    value={String(args.limit || 25)}
                    onChange={(value) => setArgs({...args, limit: Number(value), page: 1})}
                    options={LIMIT_OPTIONS}
                />
            </div>

            <div className="admin-toolbar-actions">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={(event) => setActionsAnchorEl(event.currentTarget)}
                    disabled={selectedIds.size === 0}
                >
                    Actions
                </Button>
                <Menu
                    anchorEl={actionsAnchorEl}
                    open={Boolean(actionsAnchorEl)}
                    onClose={() => setActionsAnchorEl(null)}
                >
                    <MenuItem onClick={() => {
                        setEmailDialogOpen(true);
                        setActionsAnchorEl(null);
                    }}
                    >
                        Send bulk email template…
                    </MenuItem>
                    <MenuItem onClick={() => {
                        setStatusDialogOpen(true);
                        setActionsAnchorEl(null);
                    }}
                    >
                        Change bulk artist status…
                    </MenuItem>
                </Menu>
                <Button variant="outlined" onClick={() => exportData('xlsx')}>
                    Export to Excel
                </Button>
                <Button variant="outlined" onClick={() => exportData('csv')}>
                    Export to CSV
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow className="admin-table-head">
                            <TableCell padding="checkbox">
                                <Box className="flex justify-center max-w-[32px]">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={someVisibleSelected}
                                        checked={allVisibleSelected}
                                        onChange={async (event) => {
                                            const checked = event.target.checked;
                                            if (checked) {
                                                if (data.totalCount > userList.length) {
                                                    const wantsAll = window.confirm(`Only ${userList.length} of ${data.totalCount} ${USER_LABEL.toLowerCase()}s are loaded. Increase limit to select all filtered users?`);
                                                    if (wantsAll) {
                                                        setSelectAllPending(true);
                                                        setArgs({...args, limit: data.totalCount});
                                                        return;
                                                    }
                                                }
                                                const newSet = new Set(selectedIds);
                                                userList.forEach((user) => newSet.add(user.id));
                                                setSelectedIds(newSet);
                                            } else {
                                                const newSet = new Set(selectedIds);
                                                userList.forEach((user) => newSet.delete(user.id));
                                                setSelectedIds(newSet);
                                            }
                                        }}
                                        inputProps={{'aria-label': 'Select all users on page'}}
                                    />
                                </Box>
                            </TableCell>
                            <TableCell sortDirection={sortDirection('last_name')}>
                                <TableSortLabel
                                    active={args.orderBy === 'last_name'}
                                    direction={args.orderBy === 'last_name' && args.order === 'asc' ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('last_name')}
                                >
                                    Full Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                className={styles.hideOnMobile}
                                sortDirection={sortDirection('email')}
                            >
                                <TableSortLabel
                                    active={args.orderBy === 'email'}
                                    direction={args.orderBy === 'email' && args.order === 'asc' ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('email')}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell className={styles.hideOnTablet}>Category</TableCell>
                            <TableCell
                                className={styles.hideOnTablet}
                                sortDirection={sortDirection('updatedAt')}
                            >
                                <TableSortLabel
                                    active={args.orderBy === 'updatedAt'}
                                    direction={args.orderBy === 'updatedAt' && args.order === 'asc' ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('updatedAt')}
                                >
                                    Updated
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                className={styles.hideOnMobile}
                                sortDirection={sortDirection('status')}
                            >
                                <TableSortLabel
                                    active={args.orderBy === 'status'}
                                    direction={args.orderBy === 'status' && args.order === 'asc' ? 'asc' : 'desc'}
                                    onClick={() => toggleSort('status')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell className={styles.hideOnTablet}>Images</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {userList.map(({
                            id,
                            first_name, last_name, email,
                            category, updatedAt, status: userStatus, uploads
                        }) => (
                            <TableRow
                                key={email}
                                sx={{'&:last-child td, &:last-child th': {border: 0}}}
                            >
                                <TableCell padding="checkbox">
                                    <Box className="flex justify-center max-w-[60px]">
                                        <Checkbox
                                            color="primary"
                                            checked={selectedIds.has(id)}
                                            onChange={(event) => {
                                                const newSet = new Set(selectedIds);
                                                if (event.target.checked) newSet.add(id); else newSet.delete(id);
                                                setSelectedIds(newSet);
                                            }}
                                            inputProps={{
                                                'aria-label': `Select ${email}`,
                                            }}
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/user/${id}`}>
                                        {getFullName(first_name, last_name)}
                                    </Link>
                                </TableCell>
                                <TableCell scope="row" className={styles.hideOnMobile}>
                                    <Link href={`mailto:${email}`}>{email}</Link>
                                </TableCell>
                                <TableCell className={styles.hideOnTablet}>
                                    {category}
                                </TableCell>
                                <TableCell className={styles.hideOnTablet}>
                                    {updatedAt
                                        ? new Date(updatedAt).toLocaleDateString()
                                        : 'N/A'}
                                </TableCell>
                                <TableCell className={styles.hideOnMobile}>
                                    {getStatusName(userStatus)}
                                </TableCell>
                                <TableCell className={styles.hideOnTablet}>
                                    <Link href={`/user/${id}`}>{uploads.length}</Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {status === 'ready' && userList.length === 0 && (
                <Alert severity="info">
                    No users found.
                </Alert>
            )}
            {status === 'loading' && (
                <Alert severity="info">
                    Querying Users...
                </Alert>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Typography component="p">{currentPageLabel}</Typography>
                <PaginationLinks
                    page={page}
                    setPage={(nextPage: number) => setArgs({...args, page: nextPage})}
                    pageCount={pageCount}
                />
            </Stack>

            <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{`Batch Email ${selectedIds.size} ${USER_LABEL}${selectedIds.size === 1 ? '' : 's'}`}</DialogTitle>
                <DialogContent>
                    <SendEmailAdmin
                        sendMail={sendMailSafe}
                        initialEmails={Array.from(selectedIds)
                            .map((id) => userList.find((user) => user.id === id)?.email)
                            .filter((email): email is string => !!email)
                            .join(', ')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{`Change status for ${selectedIds.size} ${USER_LABEL}${selectedIds.size === 1 ? '' : 's'}`}</DialogTitle>
                <DialogContent>
                    <UserStatusEditorAdmin
                        userStatus={profileStatuses[0]}
                        updateUserStatus={async (newStatus, sendTemplate) => {
                            const {message: resultMessage} = await updateUsersStatusBulkSafe(Array.from(selectedIds), newStatus, sendTemplate);
                            return {message: resultMessage};
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
