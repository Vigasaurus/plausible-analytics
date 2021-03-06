import React from "react";
import { withRouter, Redirect } from 'react-router-dom'

import Datamap from 'datamaps'
import SearchSelect from '../../components/search-select'
import Modal from './modal'
import { parseQuery, formattedFilters, navigateToQuery } from '../../query'
import Transition from "../../../transition";
import * as api from '../../api'

function getFilterValue(selectedFilter, query) {
  const negated = !!query.filters[selectedFilter] && query.filters[selectedFilter][0] === '!'
  let filterValue = negated ? query.filters[selectedFilter].slice(1) : (query.filters[selectedFilter] || "")

  if (selectedFilter == 'country') {
    const allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
    const selectedCountry = allCountries.find((c) => c.id === filterValue) || { properties: { name: filterValue } };
    filterValue = selectedCountry.properties.name
  }

  return {filterValue, negated}
}

function withIndefiniteArticle(word) {
  if (word.startsWith('UTM')) {
    return 'a ' + word
  } else if (['a', 'e', 'i', 'o', 'u'].some((vowel) => word.toLowerCase().startsWith(vowel))) {
    return 'an ' + word
  } else {
    return 'a ' + word
  }
}

const SECONDARY_FILTERS = {
  'browser': 'browser_version',
  'os': 'os_version',
  'source': 'referrer',
}

const SECONDARY_TO_PRIMARY = Object.keys(SECONDARY_FILTERS)
  .reduce((res, key) => Object.assign(res, {[SECONDARY_FILTERS[key]]: key}), {});

function getVersionFilter(forFilter) {
  return SECONDARY_FILTERS[forFilter]
}

class FilterModal extends React.Component {
  constructor(props) {
    super(props)
    const query = parseQuery(props.location.search, props.site)
    let selectedFilter = this.props.match.params.field || 'page'
    let secondaryFilter;

    if (Object.values(SECONDARY_FILTERS).includes(selectedFilter)) {
      selectedFilter = SECONDARY_TO_PRIMARY[selectedFilter]
    }
    secondaryFilter = SECONDARY_FILTERS[selectedFilter]

    this.state = Object.assign({selectedFilter, query}, getFilterValue(selectedFilter, query), {secondaryFilterValue: query.filters[secondaryFilter] || ''})

    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeydown)
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  handleKeydown(e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.isComposing || e.keyCode === 229) return

    if (e.target.tagName == 'BODY' && e.key == 'Enter') {
      this.handleSubmit()
    }
  }

  negationSupported(filter) {
    return ['page', 'entry_page', 'exit_page'].includes(filter)
  }

  fetchOptions(input) {
    const {query, selectedFilter} = this.state
    const updatedQuery = { ...query, filters: { ...query.filters, [selectedFilter]: null } }

    if (selectedFilter === 'country') {
      const matchedCountries = Datamap.prototype.worldTopo.objects.world.geometries.filter(c => c.properties.name.toLowerCase().includes(input.trim().toLowerCase()))
      const matches = matchedCountries.map(c => c.id)

      return api.get(`/api/stats/${encodeURIComponent(this.props.site.domain)}/suggestions/country`, updatedQuery, { q: matches })
        .then((res) => {
          return res.map(code => matchedCountries.filter(c => c.id == code)[0].properties.name)
        })
    } else {
      return api.get(`/api/stats/${encodeURIComponent(this.props.site.domain)}/suggestions/${selectedFilter}`, updatedQuery, { q: input.trim() })
    }
  }

  onInput(val) {
    this.setState({filterValue: val})
  }

  renderSearchSelector() {
    const {selectedFilter, filterValue} = this.state

    return (
      <SearchSelect
        key={selectedFilter}
        fetchOptions={this.fetchOptions.bind(this)}
        initialSelectedItem={filterValue}
        onInput={this.onInput.bind(this)}
        placeholder={`Select ${withIndefiniteArticle(formattedFilters[selectedFilter])}`}
      />
    )
  }

  fetchSecondaryOptions(filterName) {
    const {query, selectedFilter} = this.state

    return (input) => {
      const {filterValue} = this.state
      const updatedQuery = { ...query, filters: { ...query.filters, [selectedFilter]: filterValue, [filterName]: null } }

      return api.get(`/api/stats/${encodeURIComponent(this.props.site.domain)}/suggestions/${filterName}`, updatedQuery, { q: input.trim() })
    }
  }

  onSecondaryInput(val) {
    this.setState({secondaryFilterValue: val})
  }

  renderVersionSelector() {
    const {selectedFilter, filterValue, secondaryFilterValue} = this.state
    const secondaryFilter = SECONDARY_FILTERS[selectedFilter]

    if (secondaryFilter) {
      return (
        <SearchSelect
          key={selectedFilter + filterValue + secondaryFilter}
          fetchOptions={this.fetchSecondaryOptions(secondaryFilter)}
          initialSelectedItem={secondaryFilterValue}
          onInput={this.onSecondaryInput.bind(this)}
          placeholder={`${formattedFilters[secondaryFilter]} (optional)`}
        />
      )
    }
  }

  selectFiltersAndCloseModal(filters) {
    const queryString = new URLSearchParams(window.location.search)

    for (const entry of filters) {
      if (entry.value) {
        queryString.set(entry.filter, entry.value)
      } else {
        queryString.delete(entry.filter)
      }
    }

    this.props.history.replace({pathname: `/${encodeURIComponent(this.props.site.domain)}`, search: queryString.toString()})
  }

  handleSubmit() {
    const { selectedFilter, negated, filterValue, secondaryFilterValue } = this.state;

    let finalFilterValue = (this.negationSupported(selectedFilter) && negated ? '!' : '') + filterValue.trim()
    if (selectedFilter == 'country') {
      const allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
      const selectedCountry = allCountries.find((c) => c.properties.name === finalFilterValue) || { id: finalFilterValue };
      finalFilterValue = selectedCountry.id
    }

    const filters = [{filter: selectedFilter, value: finalFilterValue}]

    const secondaryFilter = SECONDARY_FILTERS[selectedFilter]

    if (secondaryFilter) {
      filters.push({filter: secondaryFilter, value: secondaryFilterValue.trim()})
    }

    this.selectFiltersAndCloseModal(filters)
  }

  updateSelectedFilter(e) {
    this.setState(Object.assign({selectedFilter: e.target.value}, getFilterValue(e.target.value, this.state.query)))
  }

  renderBody() {
    const { selectedFilter, negated, filterValue, secondaryFilterValue, query } = this.state;
    const editableFilters = Object.keys(this.state.query.filters).filter(filter => !['props'].concat(Object.values(SECONDARY_FILTERS)).includes(filter))

    return (
      <>
        <h1 className="text-xl font-bold dark:text-gray-100">{query.filters[selectedFilter] || query.filters[SECONDARY_FILTERS[selectedFilter]] ? 'Edit' : 'Add'} Filter</h1>

        <div className="my-4 border-b border-gray-300"></div>
        <main className="modal__content">
          <form className="flex flex-col" id="filter-form" onSubmit={this.handleSubmit}>
            <select
              value={selectedFilter}
              className="my-2 block w-full pr-10 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-900 dark:text-gray-300 cursor-pointer"
              placeholder="Select a Filter"
              onChange={this.updateSelectedFilter.bind(this)}
            >
              <option disabled value="" className="hidden">Select a Filter</option>
              {editableFilters.map(filter => <option key={filter} value={filter}>{formattedFilters[filter]}</option>)}
            </select>

            {this.negationSupported(selectedFilter) && (
              <div className="my-4 flex items-center">
                <label className="text-gray-700 dark:text-gray-300 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="bg-gray-100 dark:bg-gray-900 text-indigo-600 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-200 mr-2 relative inline-flex flex-shrink-0 h-6 w-8 border-1 rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none"
                    checked={negated}
                    name="exclude"
                    onChange={(e) => this.setState({ negated: e.target.checked })}
                  />
                  Exclude pages matching this filter
                </label>
              </div>
            )}

            {this.renderSearchSelector()}
            {this.renderVersionSelector()}

            <div className="mt-6 flex items-center justify-start">
              <button
                type="submit"
                disabled={filterValue.trim().length === 0 && secondaryFilterValue.trim().length === 0}
                className="button"
              >
                {query.filters[selectedFilter] || query.filters[SECONDARY_FILTERS[selectedFilter]] ? 'Update' : 'Add'} Filter
              </button>

              {query.filters[selectedFilter] && (
                <button
                  className="ml-2 button px-4 flex bg-red-500 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-700 items-center"
                  onClick={() => {
                    this.selectFiltersAndCloseModal([{filter: selectedFilter, value: null}, {filter: SECONDARY_FILTERS[selectedFilter], value: null}])
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Remove
                </button>
              )}
            </div>
          </form>
          {this.renderHints()}
        </main>
      </>
    )
  }

  renderHints() {
    if (['page', 'entry_page', 'exit_page'].includes(this.state.selectedFilter)) {
      return (
        <p className="mt-6 text-xs text-gray-500">Hint: You can use double asterisks to match any character e.g. /blog**</p>
      )
    }
  }

  render() {
    return (
      <Modal site={this.props.site} maxWidth="460px">
        { this.renderBody()}
      </Modal>
    )
  }
}

export default withRouter(FilterModal)
