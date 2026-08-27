import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { digitsOnly, isValidPhone } from '@/utils/phoneFormat';

const PHONE_LOOKUP_DEBOUNCE_MS = 320;

/**
 * Debounced staff lookup by phone when adding a walk-in queue entry.
 */
export function usePhoneCustomerLookup({ enabled, addForm }) {
    const addFormDataRef = useRef(addForm.data);
    addFormDataRef.current = addForm.data;

    const [returningCustomerMatch, setReturningCustomerMatch] = useState(false);
    const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
    const nameFromPhoneLookupRef = useRef(false);
    const phoneLookupDebounceRef = useRef(null);
    const phoneLookupAbortRef = useRef(null);
    const phoneLookupGenRef = useRef(0);

    const cancelPhoneLookupDebounce = useCallback(() => {
        if (phoneLookupDebounceRef.current !== null) {
            clearTimeout(phoneLookupDebounceRef.current);
            phoneLookupDebounceRef.current = null;
        }
    }, []);

    const resetPhoneLookupState = useCallback(() => {
        phoneLookupGenRef.current += 1;
        cancelPhoneLookupDebounce();
        phoneLookupAbortRef.current?.abort();
        phoneLookupAbortRef.current = null;
        setPhoneLookupLoading(false);
        setReturningCustomerMatch(false);
        nameFromPhoneLookupRef.current = false;
    }, [cancelPhoneLookupDebounce]);

    const runPhoneCustomerLookup = useCallback(
        (phoneDigits) => {
            phoneLookupAbortRef.current?.abort();
            const controller = new AbortController();
            phoneLookupAbortRef.current = controller;
            const gen = ++phoneLookupGenRef.current;
            setPhoneLookupLoading(true);

            axios
                .get(route('queue-dashboard.bookings.lookup-customer-by-phone'), {
                    params: { phone: phoneDigits },
                    signal: controller.signal,
                })
                .then(({ data }) => {
                    if (gen !== phoneLookupGenRef.current) {
                        return;
                    }
                    const name = typeof data?.name === 'string' ? data.name.trim() : '';
                    const matched = Boolean(data?.matched && name !== '');

                    if (matched) {
                        const current = (addFormDataRef.current.customer_name ?? '').trim();
                        if (current === '' || nameFromPhoneLookupRef.current) {
                            addForm.setData('customer_name', name);
                            nameFromPhoneLookupRef.current = true;
                        }
                        setReturningCustomerMatch(true);
                    } else {
                        if (nameFromPhoneLookupRef.current) {
                            addForm.setData('customer_name', '');
                        }
                        nameFromPhoneLookupRef.current = false;
                        setReturningCustomerMatch(false);
                    }
                })
                .catch((err) => {
                    if (gen !== phoneLookupGenRef.current || err?.code === 'ERR_CANCELED') {
                        return;
                    }
                    setReturningCustomerMatch(false);
                })
                .finally(() => {
                    if (gen !== phoneLookupGenRef.current) {
                        return;
                    }
                    setPhoneLookupLoading(false);
                });
        },
        [addForm]
    );

    const schedulePhoneCustomerLookup = useCallback(
        (phoneDigits) => {
            cancelPhoneLookupDebounce();
            if (!isValidPhone(phoneDigits)) {
                phoneLookupGenRef.current += 1;
                phoneLookupAbortRef.current?.abort();
                phoneLookupAbortRef.current = null;
                setPhoneLookupLoading(false);
                setReturningCustomerMatch(false);
                nameFromPhoneLookupRef.current = false;
                return;
            }
            phoneLookupDebounceRef.current = window.setTimeout(() => {
                phoneLookupDebounceRef.current = null;
                runPhoneCustomerLookup(phoneDigits);
            }, PHONE_LOOKUP_DEBOUNCE_MS);
        },
        [cancelPhoneLookupDebounce, runPhoneCustomerLookup]
    );

    const flushPhoneCustomerLookup = useCallback(() => {
        cancelPhoneLookupDebounce();
        const digits = digitsOnly(addFormDataRef.current.phone ?? '');
        if (isValidPhone(digits)) {
            runPhoneCustomerLookup(digits);
        }
    }, [cancelPhoneLookupDebounce, runPhoneCustomerLookup]);

    useEffect(() => {
        if (!enabled) {
            resetPhoneLookupState();
        }
    }, [enabled, resetPhoneLookupState]);

    return {
        returningCustomerMatch,
        phoneLookupLoading,
        nameFromPhoneLookupRef,
        resetPhoneLookupState,
        schedulePhoneCustomerLookup,
        flushPhoneCustomerLookup,
    };
}
