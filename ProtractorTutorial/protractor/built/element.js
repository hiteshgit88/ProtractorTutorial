"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const locators_1 = require("./locators");
const logger_1 = require("./logger");
const util_1 = require("./util");
let clientSideScripts = require('./clientsidescripts');
let logger = new logger_1.Logger('element');
class WebdriverWebElement {
}
exports.WebdriverWebElement = WebdriverWebElement;
let WEB_ELEMENT_FUNCTIONS = [
    'click', 'sendKeys', 'getTagName', 'getCssValue', 'getAttribute', 'getText', 'getSize',
    'getLocation', 'isEnabled', 'isSelected', 'submit', 'clear', 'isDisplayed', 'getId',
    'takeScreenshot'
];
/**
 * ElementArrayFinder is used for operations on an array of elements (as opposed
 * to a single element).
 *
 * The ElementArrayFinder is used to set up a chain of conditions that identify
 * an array of elements. In particular, you can call all(locator) and
 * filter(filterFn) to return a new ElementArrayFinder modified by the
 * conditions, and you can call get(index) to return a single ElementFinder at
 * position 'index'.
 *
 * Similar to jquery, ElementArrayFinder will search all branches of the DOM
 * to find the elements that satisfy the conditions (i.e. all, filter, get).
 * However, an ElementArrayFinder will not actually retrieve the elements until
 * an action is called, which means it can be set up in helper files (i.e.
 * page objects) before the page is available, and reused as the page changes.
 *
 * You can treat an ElementArrayFinder as an array of WebElements for most
 * purposes, in particular, you may perform actions (i.e. click, getText) on
 * them as you would an array of WebElements. The action will apply to
 * every element identified by the ElementArrayFinder. ElementArrayFinder
 * extends Promise, and once an action is performed on an ElementArrayFinder,
 * the latest result can be accessed using then, and will be returned as an
 * array of the results; the array has length equal to the length of the
 * elements found by the ElementArrayFinder and each result represents the
 * result of performing the action on the element. Unlike a WebElement, an
 * ElementArrayFinder will wait for the angular app to settle before
 * performing finds or actions.
 *
 * @alias element.all(locator)
 * @view
 * <ul class="items">
 *   <li>First</li>
 *   <li>Second</li>
 *   <li>Third</li>
 * </ul>
 *
 * @example
 * const items = await element.all(by.css('.items li'));
 * expect(items.length).toBe(3);
 * expect(await items[0].getText()).toBe('First');
 *
 * // Or using the shortcut $$() notation instead of element.all(by.css()):
 *
 * const items = await $$('.items li');
 * expect(items.length).toBe(3);
 * expect(await items[0].getText()).toBe('First');
 *
 * @constructor
 * @param {ProtractorBrowser} browser A browser instance.
 * @param {function(): Array.<webdriver.WebElement>} getWebElements A function
 *    that returns a list of the underlying Web Elements.
 * @param {Locator} locator The most relevant locator. It is only
 *    used for error reporting and ElementArrayFinder.locator.
 * @param {Array<Promise>} opt_actionResults An array
 *    of promises which will be retrieved with then. Resolves to the latest
 *    action result, or null if no action has been called.
 * @returns {ElementArrayFinder}
 */
class ElementArrayFinder extends WebdriverWebElement {
    constructor(browser_, getWebElements = null, locator_, actionResults_ = null) {
        super();
        this.browser_ = browser_;
        this.getWebElements = getWebElements;
        this.locator_ = locator_;
        this.actionResults_ = actionResults_;
        // TODO(juliemr): might it be easier to combine this with our docs and just
        // wrap each one explicity with its own documentation?
        WEB_ELEMENT_FUNCTIONS.forEach((fnName) => {
            this[fnName] = (...args) => {
                let actionFn = (webElem) => {
                    return webElem[fnName].apply(webElem, args);
                };
                return this.applyAction_(actionFn);
            };
        });
    }
    /**
     * Create a shallow copy of ElementArrayFinder.
     *
     * @returns {!ElementArrayFinder} A shallow copy of this.
     */
    clone() {
        // A shallow copy is all we need since the underlying fields can never be
        // modified. (Locator can be modified by the user, but that should
        // rarely/never happen and it doesn't affect functionalities).
        return new ElementArrayFinder(this.browser_, this.getWebElements, this.locator_, this.actionResults_);
    }
    /**
     * Calls to ElementArrayFinder may be chained to find an array of elements
     * using the current elements in this ElementArrayFinder as the starting
     * point. This function returns a new ElementArrayFinder which would contain
     * the children elements found (and could also be empty).
     *
     * @alias element.all(locator).all(locator)
     * @view
     * <div id='id1' class="parent">
     *   <ul>
     *     <li class="foo">1a</li>
     *     <li class="baz">1b</li>
     *   </ul>
     * </div>
     * <div id='id2' class="parent">
     *   <ul>
     *     <li class="foo">2a</li>
     *     <li class="bar">2b</li>
     *   </ul>
     * </div>
     *
     * @example
     * let foo = element.all(by.css('.parent')).all(by.css('.foo'));
     * expect(await foo.getText()).toEqual(['1a', '2a']);
     * let baz = element.all(by.css('.parent')).all(by.css('.baz'));
     * expect(await baz.getText()).toEqual(['1b']);
     * let nonexistent = element.all(by.css('.parent'))
     *   .all(by.css('.NONEXISTENT'));
     * expect(await nonexistent.getText()).toEqual(['']);
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let foo = $$('.parent').$$('.foo');
     * expect(await foo.getText()).toEqual(['1a', '2a']);
     * let baz = $$('.parent').$$('.baz');
     * expect(await baz.getText()).toEqual(['1b']);
     * let nonexistent = $$('.parent').$$('.NONEXISTENT');
     * expect(await nonexistent.getText()).toEqual(['']);
     *
     * @param {Locator} locator
     * @returns {ElementArrayFinder}
     */
    all(locator) {
        const ptor = this.browser_;
        const getWebElements = () => __awaiter(this, void 0, void 0, function* () {
            if (this.getWebElements === null) {
                // This is the first time we are looking for an element
                yield ptor.waitForAngular('Locator: ' + locator);
                if (locators_1.isProtractorLocator(locator)) {
                    return locator.findElementsOverride(ptor.driver, null, ptor.rootEl);
                }
                else {
                    return ptor.driver.findElements(locator);
                }
            }
            else {
                const parentWebElements = yield this.getWebElements();
                // For each parent web element, find their children and construct
                // a list of Promise<List<child_web_element>>
                const childrenPromiseList = parentWebElements.map((parentWebElement) => {
                    return locators_1.isProtractorLocator(locator) ?
                        locator.findElementsOverride(ptor.driver, parentWebElement, ptor.rootEl) :
                        parentWebElement.findElements(locator);
                });
                // Resolve the list of Promise<List<child_web_elements>> and merge
                // into a single list
                const resolved = yield Promise.all(childrenPromiseList);
                return resolved.reduce((childrenList, resolvedE) => {
                    return childrenList.concat(resolvedE);
                }, []);
            }
        });
        return new ElementArrayFinder(this.browser_, getWebElements, locator);
    }
    /**
     * Apply a filter function to each element within the ElementArrayFinder.
     * Returns a new ElementArrayFinder with all elements that pass the filter
     * function. The filter function receives the ElementFinder as the first
     * argument and the index as a second arg. This does not actually retrieve
     * the underlying list of elements, so it can be used in page objects.
     *
     * @alias element.all(locator).filter(filterFn)
     * @view
     * <ul class="items">
     *   <li class="one">First</li>
     *   <li class="two">Second</li>
     *   <li class="three">Third</li>
     * </ul>
     *
     * @example
     * await element.all(by.css('.items li'))
     *   .filter(async (elem, index) => await elem.getText() === 'Third')
     *   .first()
     *   .click();
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * await $$('.items li')
     *   .filter(async (elem, index) => await elem.getText() === 'Third')
     *   .first()
     *   .click();
     *
     * @param {function(ElementFinder, number): boolean|Promise<boolean>} filterFn
     *     Filter function that will test if an element should be returned.
     *     filterFn can either return a boolean or a promise that resolves to a
     *     boolean.
     * @returns {!ElementArrayFinder} A ElementArrayFinder that represents an
     * array
     *     of element that satisfy the filter function.
     */
    filter(filterFn) {
        const getWebElements = () => __awaiter(this, void 0, void 0, function* () {
            const parentWebElements = yield this.getWebElements();
            const list = parentWebElements.map((parentWebElement, index) => {
                let elementFinder = ElementFinder.fromWebElement_(this.browser_, parentWebElement, this.locator_);
                return filterFn(elementFinder, index);
            });
            const resolvedList = yield Promise.all(list);
            return parentWebElements.filter((_, index) => {
                return resolvedList[index];
            });
        });
        return new ElementArrayFinder(this.browser_, getWebElements, this.locator_);
    }
    /**
     * Get an element within the ElementArrayFinder by index. The index starts at
     * 0. Negative indices are wrapped (i.e. -i means ith element from last)
     * This does not actually retrieve the underlying element.
     *
     * @alias element.all(locator).get(index)
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * let list = element.all(by.css('.items li'));
     * expect(await list.get(0).getText()).toBe('First');
     * expect(await list.get(1).getText()).toBe('Second');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let list = $$('.items li');
     * expect(await list.get(0).getText()).toBe('First');
     * expect(await list.get(1).getText()).toBe('Second');
     *
     * @param {number|Promise} indexPromise Element index.
     * @returns {ElementFinder} finder representing element at the given index.
     */
    get(indexPromise) {
        const getWebElements = () => __awaiter(this, void 0, void 0, function* () {
            let index = yield indexPromise;
            const parentWebElements = yield this.getWebElements();
            if (index < 0) {
                index += parentWebElements.length;
            }
            if (index < 0 || index >= parentWebElements.length) {
                throw new selenium_webdriver_1.error.NoSuchElementError(`Index out of bound. Trying to access element at index: ` +
                    `${index}, but there are only ${parentWebElements.length} ` +
                    `elements that match locator ${this.locator_.toString()}`);
            }
            return [parentWebElements[index]];
        });
        return new ElementArrayFinder(this.browser_, getWebElements, this.locator_).toElementFinder_();
    }
    /**
     * Get the first matching element for the ElementArrayFinder. This does not
     * actually retrieve the underlying element.
     *
     * @alias element.all(locator).first()
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * let first = element.all(by.css('.items li')).first();
     * expect(await first.getText()).toBe('First');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let first = $$('.items li').first();
     * expect(await first.getText()).toBe('First');
     *
     * @returns {ElementFinder} finder representing the first matching element
     */
    first() {
        return this.get(0);
    }
    /**
     * Get the last matching element for the ElementArrayFinder. This does not
     * actually retrieve the underlying element.
     *
     * @alias element.all(locator).last()
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * let last = element.all(by.css('.items li')).last();
     * expect(await last.getText()).toBe('Third');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let last = $$('.items li').last();
     * expect(await last.getText()).toBe('Third');
     *
     * @returns {ElementFinder} finder representing the last matching element
     */
    last() {
        return this.get(-1);
    }
    /**
     * Shorthand function for finding arrays of elements by css.
     * `element.all(by.css('.abc'))` is equivalent to `$$('.abc')`
     *
     * @alias $$(cssSelector)
     * @view
     * <div class="count">
     *   <span class="one">First</span>
     *   <span class="two">Second</span>
     * </div>
     *
     * @example
     * // The following two blocks of code are equivalent.
     * let list = element.all(by.css('.count span'));
     * expect(await list.count()).toBe(2);
     * expect(await list.get(0).getText()).toBe('First');
     * expect(await list.get(1).getText()).toBe('Second');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let list = $$('.count span');
     * expect(await list.count()).toBe(2);
     * expect(await list.get(0).getText()).toBe('First');
     * expect(await list.get(1).getText()).toBe('Second');
     *
     * @param {string} selector a css selector
     * @returns {ElementArrayFinder} which identifies the
     *     array of the located {@link webdriver.WebElement}s.
     */
    $$(selector) {
        return this.all(selenium_webdriver_1.By.css(selector));
    }
    /**
     * Returns an ElementFinder representation of ElementArrayFinder. It ensures
     * that the ElementArrayFinder resolves to one and only one underlying
     * element.
     *
     * @returns {ElementFinder} An ElementFinder representation
     * @private
     */
    toElementFinder_() {
        return new ElementFinder(this.browser_, this);
    }
    /**
     * Count the number of elements represented by the ElementArrayFinder.
     *
     * @alias element.all(locator).count()
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * let list = element.all(by.css('.items li'));
     * expect(await list.count()).toBe(3);
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let list = $$('.items li');
     * expect(await list.count()).toBe(3);
     *
     * @returns {!Promise} A promise which resolves to the
     *     number of elements matching the locator.
     */
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const arr = yield this.getWebElements();
                return arr.length;
            }
            catch (err) {
                if (err instanceof selenium_webdriver_1.error.NoSuchElementError) {
                    return 0;
                }
                else {
                    throw err;
                }
            }
        });
    }
    /**
     * Returns true if there are any elements present that match the finder.
     *
     * @alias element.all(locator).isPresent()
     *
     * @example
     * expect(await $('.item').isPresent()).toBeTruthy();
     *
     * @returns {Promise<boolean>}
     */
    isPresent() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.count();
            return count > 0;
        });
    }
    /**
     * Returns the most relevant locator.
     *
     * @example
     * // returns by.css('#ID1')
     * $('#ID1').locator();
     *
     * // returns by.css('#ID2')
     * $('#ID1').$('#ID2').locator();
     *
     * // returns by.css('#ID1')
     * $$('#ID1').filter(filterFn).get(0).click().locator();
     *
     * @returns {Locator}
     */
    locator() {
        return this.locator_;
    }
    /**
     * Apply an action function to every element in the ElementArrayFinder,
     * and return a new ElementArrayFinder that contains the results of the
     * actions.
     *
     * @param {function(ElementFinder)} actionFn
     *
     * @returns {ElementArrayFinder}
     * @private
     */
    // map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    applyAction_(actionFn) {
        const callerError = new Error();
        let actionResults = this.getWebElements()
            .then((arr) => Promise.all(arr.map(actionFn)))
            .then((value) => {
            return { passed: true, value };
        }, (error) => {
            return { passed: false, value: error };
        });
        const getWebElements = () => actionResults.then(() => this.getWebElements());
        actionResults = actionResults.then((result) => {
            if (result.passed) {
                return result.value;
            }
            else {
                let noSuchErr;
                if (result.value instanceof Error) {
                    noSuchErr = result.value;
                    noSuchErr.stack = noSuchErr.stack + callerError.stack;
                }
                else {
                    noSuchErr = new Error(result.value);
                    noSuchErr.stack = callerError.stack;
                }
                throw noSuchErr;
            }
        });
        return new ElementArrayFinder(this.browser_, getWebElements, this.locator_, actionResults);
    }
    /**
     * Represents the ElementArrayFinder as an array of ElementFinders.
     *
     * @returns {Promise<ElementFinder[]>} Return a promise, which resolves to a
     *   list of ElementFinders specified by the locator.
     */
    asElementFinders_() {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = yield this.getWebElements();
            return arr.map((webElem) => {
                return ElementFinder.fromWebElement_(this.browser_, webElem, this.locator_);
            });
        });
    }
    /**
     * Retrieve the elements represented by the ElementArrayFinder. The input
     * function is passed to the resulting promise, which resolves to an
     * array of ElementFinders.
     *
     * @alias element.all(locator).then(thenFunction)
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * const arr = await element.all(by.css('.items li'));
     * expect(arr.length).toEqual(3);
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * const arr = $$('.items li');
     * expect(arr.length).toEqual(3);
     *
     * @param {function(Array.<ElementFinder>)} fn
     * @param {function(Error)} errorFn
     *
     * @returns {!Promise} A promise which will resolve to
     *     an array of ElementFinders represented by the ElementArrayFinder.
     */
    then(fn, errorFn) {
        if (this.actionResults_) {
            return this.actionResults_.then(fn, errorFn);
        }
        else {
            return this.asElementFinders_().then(fn, errorFn);
        }
    }
    /**
     * Calls the input function on each ElementFinder represented by the
     * ElementArrayFinder.
     *
     * @alias element.all(locator).each(eachFunction)
     * @view
     * <ul class="items">
     *   <li>First</li>
     *   <li>Second</li>
     *   <li>Third</li>
     * </ul>
     *
     * @example
     * await element.all(by.css('.items li')).each(async (element, index) => {
     *   // Will print 0 First, 1 Second, 2 Third.
     *   console.log(index, await element.getText());
     * });
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * $$('.items li').each(async (element, index) => {
     *   // Will print 0 First, 1 Second, 2 Third.
     *   console.log(index, await element.getText());
     * });
     *
     * @param {function(ElementFinder)} fn Input function
     *
     * @returns {!Promise} A promise that will resolve when the
     *     function has been called on all the ElementFinders. The promise will
     *     resolve to null.
     */
    each(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.map(fn);
        });
    }
    /**
     * Apply a map function to each element within the ElementArrayFinder. The
     * callback receives the ElementFinder as the first argument and the index as
     * a second arg.
     *
     * @alias element.all(locator).map(mapFunction)
     * @view
     * <ul class="items">
     *   <li class="one">First</li>
     *   <li class="two">Second</li>
     *   <li class="three">Third</li>
     * </ul>
     *
     * @example
     * let items = await element.all(by.css('.items li'))
     *   .map(async (elm, index) => {
     *     return {
     *       index: index,
     *       text: await elm.getText(),
     *       class: await elm.getAttribute('class')
     *     };
     *   });
     * expect(items).toEqual([
     *   {index: 0, text: 'First', class: 'one'},
     *   {index: 1, text: 'Second', class: 'two'},
     *   {index: 2, text: 'Third', class: 'three'}
     * ]);
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let items = await $$('.items li').map(async (elm, index) => {
     *   return {
     *     index: index,
     *     text: await elm.getText(),
     *     class: await elm.getAttribute('class')
     *   };
     * });
     * expect(items).toEqual([
     *   {index: 0, text: 'First', class: 'one'},
     *   {index: 1, text: 'Second', class: 'two'},
     *   {index: 2, text: 'Third', class: 'three'}
     * ]);
     *
     * @param {function(ElementFinder, number)} mapFn Map function that
     *     will be applied to each element.
     * @returns {!Promise} A promise that resolves to an array
     *     of values returned by the map function.
     */
    map(mapFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const arr = yield this.asElementFinders_();
            const list = arr.map((elementFinder, index) => __awaiter(this, void 0, void 0, function* () {
                let mapResult = mapFn(elementFinder, index);
                // All nested arrays and objects will also be fully resolved.
                return yield mapResult;
            }));
            return Promise.all(list);
        });
    }
    /**
     * Apply a reduce function against an accumulator and every element found
     * using the locator (from left-to-right). The reduce function has to reduce
     * every element into a single value (the accumulator). Returns promise of
     * the accumulator. The reduce function receives the accumulator, current
     * ElementFinder, the index, and the entire array of ElementFinders,
     * respectively.
     *
     * @alias element.all(locator).reduce(reduceFn)
     * @view
     * <ul class="items">
     *   <li class="one">First</li>
     *   <li class="two">Second</li>
     *   <li class="three">Third</li>
     * </ul>
     *
     * @example
     * let value = await element.all(by.css('.items li'))
     *   .reduce(async (acc, elem) => acc + (await elem.getText()) + ' ', '');
     *
     * expect(value).toEqual('First Second Third ');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let value = await $$('.items li')
     *   .reduce(async (acc, elem) => acc + (await elem.getText()) + ' ', '');
     *
     * expect(value).toEqual('First Second Third ');
     *
     * @param {function(number, ElementFinder, number, Array.<ElementFinder>)}
     *     reduceFn Reduce function that reduces every element into a single
     * value.
     * @param {*} initialValue Initial value of the accumulator.
     * @returns {!Promise} A promise that resolves to the final
     *     value of the accumulator.
     */
    reduce(reduceFn, initialValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const valuePromise = yield initialValue;
            const arr = yield this.asElementFinders_();
            return arr.reduce((valuePromise, elementFinder, index) => __awaiter(this, void 0, void 0, function* () {
                return reduceFn(yield valuePromise, elementFinder, index, arr);
            }), valuePromise);
        });
    }
    /**
     * Evaluates the input as if it were on the scope of the current underlying
     * elements.
     *
     * @view
     * <span class="foo">{{letiableInScope}}</span>
     *
     * @example
     * let value = element.all(by.css('.foo')).evaluate('letiableInScope');
     *
     * // Or using the shortcut $$() notation instead of element.all(by.css()):
     *
     * let value = $$('.foo').evaluate('letiableInScope');
     *
     * @param {string} expression
     *
     * @returns {ElementArrayFinder} which resolves to the
     *     evaluated expression for each underlying element.
     *     The result will be resolved as in
     *     {@link webdriver.WebDriver.executeScript}. In summary - primitives will
     *     be resolved as is, functions will be converted to string, and elements
     *     will be returned as a WebElement.
     */
    evaluate(expression) {
        const evaluationFn = (webElem) => {
            return webElem.getDriver().executeScript(clientSideScripts.evaluate, webElem, expression);
        };
        return this.applyAction_(evaluationFn);
    }
    /**
     * Determine if animation is allowed on the current underlying elements.
     * @param {string} value
     *
     * @example
     * // Turns off ng-animate animations for all elements in the <body>
     * element(by.css('body')).allowAnimations(false);
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * $('body').allowAnimations(false);
     *
     * @returns {ElementArrayFinder} which resolves to whether animation is
     * allowed.
     */
    allowAnimations(value) {
        const allowAnimationsTestFn = (webElem) => {
            return webElem.getDriver().executeScript(clientSideScripts.allowAnimations, webElem, value);
        };
        return this.applyAction_(allowAnimationsTestFn);
    }
}
exports.ElementArrayFinder = ElementArrayFinder;
/**
 * The ElementFinder simply represents a single element of an
 * ElementArrayFinder (and is more like a convenience object). As a result,
 * anything that can be done with an ElementFinder, can also be done using
 * an ElementArrayFinder.
 *
 * The ElementFinder can be treated as a WebElement for most purposes, in
 * particular, you may perform actions (i.e. click, getText) on them as you
 * would a WebElement. Once an action is performed on an ElementFinder, the
 * latest result from the chain can be accessed using the then method.
 * Unlike a WebElement, an ElementFinder will wait for angular to settle before
 * performing finds or actions.
 *
 * ElementFinder can be used to build a chain of locators that is used to find
 * an element. An ElementFinder does not actually attempt to find the element
 * until an action is called, which means they can be set up in helper files
 * before the page is available.
 *
 * @alias element(locator)
 * @view
 * <span>{{person.name}}</span>
 * <span ng-bind="person.email"></span>
 * <input type="text" ng-model="person.name"/>
 *
 * @example
 * // Find element with {{scopelet}} syntax.
 * const name = await element(by.binding('person.name')).getText();
 * expect(name).toBe('Foo');
 *
 * // Find element with ng-bind="scopelet" syntax.
 * const email = await element(by.binding('person.email')).getText();
 * expect(email).toBe('foo@bar.com');
 *
 * // Find by model.
 * let input = element(by.model('person.name'));
 * await input.sendKeys('123');
 * expect(await input.getAttribute('value')).toBe('Foo123');
 *
 * @constructor
 * @extends {webdriver.WebElement}
 * @param {ProtractorBrowser} browser_ A browser instance.
 * @param {ElementArrayFinder} elementArrayFinder The ElementArrayFinder
 *     that this is branched from.
 * @returns {ElementFinder}
 */
class ElementFinder extends WebdriverWebElement {
    constructor(browser_, elementArrayFinder) {
        super();
        this.browser_ = browser_;
        this.then = null;
        if (!elementArrayFinder) {
            throw new Error('BUG: elementArrayFinder cannot be empty');
        }
        this.parentElementArrayFinder = elementArrayFinder;
        // Only have a `then` method if the parent element array finder
        // has action results.
        if (this.parentElementArrayFinder.actionResults_) {
            // Access the underlying actionResult of ElementFinder.
            this.then = (fn, errorFn) => {
                return this.elementArrayFinder_.then((actionResults) => {
                    if (!fn) {
                        return actionResults[0];
                    }
                    return fn(actionResults[0]);
                }, errorFn);
            };
        }
        // This filter verifies that there is only 1 element returned by the
        // elementArrayFinder. It will warn if there are more than 1 element and
        // throw an error if there are no elements.
        const getWebElements = () => __awaiter(this, void 0, void 0, function* () {
            const webElements = yield elementArrayFinder.getWebElements();
            if (webElements.length === 0) {
                throw new selenium_webdriver_1.error.NoSuchElementError('No element found using locator: ' + elementArrayFinder.locator().toString());
            }
            else {
                if (webElements.length > 1) {
                    logger.warn('more than one element found for locator ' + elementArrayFinder.locator().toString() +
                        ' - the first result will be used');
                }
                return [webElements[0]];
            }
        });
        // Store a copy of the underlying elementArrayFinder, but with the more
        // restrictive getWebElements (which checks that there is only 1 element).
        this.elementArrayFinder_ = new ElementArrayFinder(this.browser_, getWebElements, elementArrayFinder.locator(), elementArrayFinder.actionResults_);
        WEB_ELEMENT_FUNCTIONS.forEach((fnName) => {
            (this)[fnName] = (...args) => {
                return (this.elementArrayFinder_)[fnName]
                    .apply(this.elementArrayFinder_, args)
                    .toElementFinder_();
            };
        });
    }
    static fromWebElement_(browser, webElem, locator) {
        const getWebElements = () => {
            return Promise.resolve([webElem]);
        };
        return new ElementArrayFinder(browser, getWebElements, locator).toElementFinder_();
    }
    /**
     * Create a shallow copy of ElementFinder.
     *
     * @returns {!ElementFinder} A shallow copy of this.
     */
    clone() {
        // A shallow copy is all we need since the underlying fields can never be
        // modified
        return new ElementFinder(this.browser_, this.parentElementArrayFinder);
    }
    /**
     * @see ElementArrayFinder.prototype.locator
     *
     * @returns {Locator}
     */
    locator() {
        return this.elementArrayFinder_.locator();
    }
    /**
     * Returns the WebElement represented by this ElementFinder.
     * Throws the WebDriver error if the element doesn't exist.
     *
     * @alias element(locator).getWebElement()
     * @view
     * <div class="parent">
     *   some text
     * </div>
     *
     * @example
     * // The following four expressions are equivalent.
     * $('.parent').getWebElement();
     * element(by.css('.parent')).getWebElement();
     * browser.driver.findElement(by.css('.parent'));
     * browser.findElement(by.css('.parent'));
     *
     * @returns {webdriver.WebElement}
     */
    getWebElement() {
        const id = this.elementArrayFinder_.getWebElements().then((parentWebElements) => {
            return parentWebElements[0];
        });
        return new selenium_webdriver_1.WebElementPromise(this.browser_.driver, id);
    }
    /**
     * Calls to {@code all} may be chained to find an array of elements within a
     * parent.
     *
     * @alias element(locator).all(locator)
     * @view
     * <div class="parent">
     *   <ul>
     *     <li class="one">First</li>
     *     <li class="two">Second</li>
     *     <li class="three">Third</li>
     *   </ul>
     * </div>
     *
     * @example
     * let items = element(by.css('.parent')).all(by.tagName('li'));
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * let items = $('.parent').all(by.tagName('li'));
     *
     * @param {Locator} subLocator
     * @returns {ElementArrayFinder}
     */
    all(subLocator) {
        return this.elementArrayFinder_.all(subLocator);
    }
    /**
     * Calls to {@code element} may be chained to find elements within a parent.
     *
     * @alias element(locator).element(locator)
     * @view
     * <div class="parent">
     *   <div class="child">
     *     Child text
     *     <div>{{person.phone}}</div>
     *   </div>
     * </div>
     *
     * @example
     * // Chain 2 element calls.
     * let child = element(by.css('.parent')).
     *     element(by.css('.child'));
     * expect(await child.getText()).toBe('Child text\n555-123-4567');
     *
     * // Chain 3 element calls.
     * let triple = element(by.css('.parent')).
     *     element(by.css('.child')).
     *     element(by.binding('person.phone'));
     * expect(await triple.getText()).toBe('555-123-4567');
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * // Chain 2 element calls.
     * let child = $('.parent').$('.child');
     * expect(await child.getText()).toBe('Child text\n555-123-4567');
     *
     * // Chain 3 element calls.
     * let triple = $('.parent').$('.child').
     *     element(by.binding('person.phone'));
     * expect(await triple.getText()).toBe('555-123-4567');
     *
     * @param {Locator} subLocator
     * @returns {ElementFinder}
     */
    element(subLocator) {
        return this.all(subLocator).toElementFinder_();
    }
    /**
     * Calls to {@code $$} may be chained to find an array of elements within a
     * parent.
     *
     * @alias element(locator).all(selector)
     * @view
     * <div class="parent">
     *   <ul>
     *     <li class="one">First</li>
     *     <li class="two">Second</li>
     *     <li class="three">Third</li>
     *   </ul>
     * </div>
     *
     * @example
     * let items = element(by.css('.parent')).$$('li');
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * let items = $('.parent').$$('li');
     *
     * @param {string} selector a css selector
     * @returns {ElementArrayFinder}
     */
    $$(selector) {
        return this.all(selenium_webdriver_1.By.css(selector));
    }
    /**
     * Calls to {@code $} may be chained to find elements within a parent.
     *
     * @alias element(locator).$(selector)
     * @view
     * <div class="parent">
     *   <div class="child">
     *     Child text
     *     <div>{{person.phone}}</div>
     *   </div>
     * </div>
     *
     * @example
     * // Chain 2 element calls.
     * let child = element(by.css('.parent')).
     *     $('.child');
     * expect(await child.getText()).toBe('Child text\n555-123-4567');
     *
     * // Chain 3 element calls.
     * let triple = element(by.css('.parent')).
     *     $('.child').
     *     element(by.binding('person.phone'));
     * expect(await triple.getText()).toBe('555-123-4567');
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * // Chain 2 element calls.
     * let child = $('.parent').$('.child');
     * expect(await child.getText()).toBe('Child text\n555-123-4567');
     *
     * // Chain 3 element calls.
     * let triple = $('.parent').$('.child').
     *     element(by.binding('person.phone'));
     * expect(await triple.getText()).toBe('555-123-4567');
     *
     * @param {string} selector A css selector
     * @returns {ElementFinder}
     */
    $(selector) {
        return this.element(selenium_webdriver_1.By.css(selector));
    }
    /**
     * Determine whether the element is present on the page.
     *
     * @view
     * <span>{{person.name}}</span>
     *
     * @example
     * // Element exists.
     * expect(await element(by.binding('person.name')).isPresent()).toBe(true);
     *
     * // Element not present.
     * expect(await element(by.binding('notPresent')).isPresent()).toBe(false);
     *
     * @returns {Promise<boolean>} which resolves to whether
     *     the element is present on the page.
     */
    isPresent() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const arr = yield this.parentElementArrayFinder.getWebElements();
                if (arr.length === 0) {
                    return false;
                }
                // is present, whether it is enabled or not
                return yield arr[0].isEnabled();
            }
            catch (err) {
                return util_1.falseIfMissing(err);
            }
        });
    }
    /**
     * Same as ElementFinder.isPresent(), except this checks whether the element
     * identified by the subLocator is present, rather than the current element
     * finder, i.e.: `element(by.css('#abc')).element(by.css('#def')).isPresent()`
     * is identical to `element(by.css('#abc')).isElementPresent(by.css('#def'))`.
     *
     * // Or using the shortcut $() notation instead of element(by.css()):
     *
     * `$('#abc').$('#def').isPresent()` is identical to
     * `$('#abc').isElementPresent($('#def'))`.
     *
     * @see ElementFinder.isPresent
     *
     * @param {Locator} subLocator Locator for element to look for.
     * @returns {Promise<boolean>} which resolves to whether
     *     the subelement is present on the page.
     */
    isElementPresent(subLocator) {
        if (!subLocator) {
            throw new Error('SubLocator is not supplied as a parameter to ' +
                '`isElementPresent(subLocator)`. You are probably looking for the ' +
                'function `isPresent()`.');
        }
        return this.element(subLocator).isPresent();
    }
    /**
     * Evaluates the input as if it were on the scope of the current element.
     * @see ElementArrayFinder.prototype.evaluate
     *
     * @view
     * <span id="foo">{{letiableInScope}}</span>
     *
     * @example
     * let value = element(by.id('foo')).evaluate('letiableInScope');
     *
     * @param {string} expression
     *
     * @returns {ElementFinder} which resolves to the evaluated expression.
     */
    evaluate(expression) {
        return this.elementArrayFinder_.evaluate(expression).toElementFinder_();
    }
    /**
     * @see ElementArrayFinder.prototype.allowAnimations.
     * @param {string} value
     *
     * @returns {ElementFinder} which resolves to whether animation is allowed.
     */
    allowAnimations(value) {
        return this.elementArrayFinder_.allowAnimations(value).toElementFinder_();
    }
    /**
     * Compares an element to this one for equality.
     *
     * @param {!ElementFinder|!webdriver.WebElement} element The element to compare to.
     *
     * @returns {!Promise<boolean>} A promise that will be
     *     resolved to whether the two WebElements are equal.
     */
    equals(element) {
        return __awaiter(this, void 0, void 0, function* () {
            const a = yield this.getWebElement();
            const b = element.getWebElement ? yield element.getWebElement() :
                element;
            // TODO(selenium4): Use `return WebElement.equals(a, b);` when
            // https://github.com/SeleniumHQ/selenium/pull/6749 is fixed.
            return a.getDriver().executeScript('return arguments[0] === arguments[1]', a, b);
        });
    }
}
exports.ElementFinder = ElementFinder;
/**
 * Shortcut for querying the document directly with css.
 * `element(by.css('.abc'))` is equivalent to `$('.abc')`
 *
 * @alias $(cssSelector)
 * @view
 * <div class="count">
 *   <span class="one">First</span>
 *   <span class="two">Second</span>
 * </div>
 *
 * @example
 * let item = $('.count .two');
 * expect(await item.getText()).toBe('Second');
 *
 * @param {string} selector A css selector
 * @returns {ElementFinder} which identifies the located
 *     {@link webdriver.WebElement}
 */
exports.build$ = (element, by) => {
    return (selector) => {
        return element(by.css(selector));
    };
};
/**
 * Shortcut for querying the document directly with css.
 * `element.all(by.css('.abc'))` is equivalent to `$$('.abc')`
 *
 * @alias $$(cssSelector)
 * @view
 * <div class="count">
 *   <span class="one">First</span>
 *   <span class="two">Second</span>
 * </div>
 *
 * @example
 * // The following protractor expressions are equivalent.
 * let list = element.all(by.css('.count span'));
 * expect(await list.count()).toBe(2);
 *
 * list = $$('.count span');
 * expect(await list.count()).toBe(2);
 * expect(await list.get(0).getText()).toBe('First');
 * expect(await list.get(1).getText()).toBe('Second');
 *
 * @param {string} selector a css selector
 * @returns {ElementArrayFinder} which identifies the
 *     array of the located {@link webdriver.WebElement}s.
 */
exports.build$$ = (element, by) => {
    return (selector) => {
        return element.all(by.css(selector));
    };
};
//# sourceMappingURL=element.js.map