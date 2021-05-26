/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { useLocation, Outlet } from 'react-router';

import { useSearch, SearchContextProvider } from '../SearchContext';
import { SearchPageNext } from './';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn().mockReturnValue({
    search: '',
  }),
  Outlet: jest.fn().mockReturnValue(null),
}));

jest.mock('../SearchContext', () => ({
  ...jest.requireActual('../SearchContext'),
  SearchContextProvider: jest
    .fn()
    .mockImplementation(({ children }) => children),
  useSearch: jest.fn().mockReturnValue({
    term: '',
    types: [],
    filters: {},
    pageCursor: '',
  }),
}));

describe('SearchPage', () => {
  const origReplaceState = window.history.replaceState;

  beforeEach(() => {
    window.history.replaceState = jest.fn();
  });

  afterEach(() => {
    window.history.replaceState = origReplaceState;
  });

  it('uses initial term state from location', async () => {
    // Given this initial location.search value...
    const expectedFilterField = 'anyKey';
    const expectedFilterValue = 'anyValue';
    const expectedTerm = 'justin bieber';
    const expectedTypes = ['software-catalog'];
    const expectedFilters = { [expectedFilterField]: expectedFilterValue };
    const expectedPageCursor = 'page2-or-something';

    // e.g. ?query=petstore&pageCursor=1&filters[lifecycle][]=experimental&filters[kind]=Component
    (useLocation as jest.Mock).mockReturnValueOnce({
      search: `?query=${expectedTerm}&types[]=${expectedTypes[0]}&filters[${expectedFilterField}]=${expectedFilterValue}&pageCursor=${expectedPageCursor}`,
    });

    // When we render the page...
    await renderInTestApp(<SearchPageNext />);

    // Then search context should be initialized with these values...
    const calls = (SearchContextProvider as jest.Mock).mock.calls[0];
    const actualInitialState = calls[0].initialState;
    expect(actualInitialState.term).toEqual(expectedTerm);
    expect(actualInitialState.types).toEqual(expectedTypes);
    expect(actualInitialState.pageCursor).toEqual(expectedPageCursor);
    expect(actualInitialState.filters).toStrictEqual(expectedFilters);
  });

  it('renders provided router element', async () => {
    await renderInTestApp(<SearchPageNext />);

    expect(Outlet).toHaveBeenCalled();
  });

  it('replaces window history with expected query parameters', async () => {
    (useSearch as jest.Mock).mockReturnValueOnce({
      term: 'bieber',
      types: ['software-catalog'],
      pageCursor: 'page2-or-something',
      filters: { anyKey: 'anyValue' },
    });
    const expectedLocation = encodeURI(
      '?query=bieber&types[]=software-catalog&pageCursor=page2-or-something&filters[anyKey]=anyValue',
    );

    await renderInTestApp(<SearchPageNext />);

    const calls = (window.history.replaceState as jest.Mock).mock.calls[0];
    expect(calls[2]).toContain(expectedLocation);
  });
});
