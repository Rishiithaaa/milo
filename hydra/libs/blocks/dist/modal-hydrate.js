/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-cycle */
import {
  createTag,
  getMetadata,
  localizeLink,
  loadStyle,
  getConfig
} from '../../utils/utils.js';
import {
  decorateSectionAnalytics
} from '../../martech/attributes.js';
const FOCUSABLES = 'a:not(.hide-video), button:not([disabled], .locale-modal-v2 .paddle), input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
const CLOSE_ICON = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <g transform="translate(-10500 3403)">
    <circle cx="10" cy="10" r="10" transform="translate(10500 -3403)" fill="#707070"/>
    <line y1="8" x2="8" transform="translate(10506 -3397)" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="8" y1="8" transform="translate(10506 -3397)" fill="none" stroke="#fff" stroke-width="2"/>
  </g>
</svg>`;
let isDelayedModal = false;
let prevHash = '';
const dialogLoadingSet = new Set();

function findDetails(hash, el) {
  const id = hash.replace('#', '');
  const a = el || document.querySelector(`a[data-modal-hash="${hash}"]`);
  const path = a?.dataset.modalPath || localizeLink(getMetadata(`-${id}`));
  return {
    id,
    path,
    isHash: hash === window.location.hash
  };
}

function closeModal(modal) {
  const {
    id
  } = modal;
  const closeEvent = new Event('milo:modal:closed');
  window.dispatchEvent(closeEvent);
  document.querySelectorAll(`#${id}`).forEach(mod => {
    if (mod.classList.contains('dialog-modal')) {
      const modalCurtain = document.querySelector(`#${id}~.modal-curtain`);
      if (modalCurtain) {
        modalCurtain.remove();
      }
      mod.remove();
    }
    document.querySelector(`[data-modal-hash="#${mod.id}"]`)?.focus();
  });
  if (!document.querySelectorAll('.modal-curtain').length) {
    document.body.classList.remove('disable-scroll');
  }
  [...document.querySelectorAll('header, main, footer')].forEach(element => element.removeAttribute('aria-disabled'));
  const hashId = window.location.hash.replace('#', '');
  if (hashId === modal.id) window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`);
  isDelayedModal = false;
  if (prevHash) {
    window.location.hash = prevHash;
    prevHash = '';
  }
}

function isElementInView(element) {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

function getCustomModal(custom, dialog) {
  const {
    miloLibs,
    codeRoot
  } = getConfig();
  loadStyle(`${miloLibs || codeRoot}/blocks/modal/modal.css`);
  if (custom.id) dialog.id = custom.id;
  if (custom.class) dialog.classList.add(custom.class);
  if (custom.closeEvent) {
    dialog.addEventListener(custom.closeEvent, () => {
      closeModal(dialog);
    });
  }
  dialog.append(custom.content);
}
async function getPathModal(path, dialog) {
  let href = path;
  if (path.includes('/federal/')) {
    const {
      getFederatedUrl
    } = await import('../../utils/utils.js');
    href = getFederatedUrl(path);
  }
  const block = createTag('a', {
    href
  });
  dialog.append(block);

  // eslint-disable-next-line import/no-cycle
  const {
    default: getFragment
  } = await import('../fragment/fragment.js');
  await getFragment(block);
}
async function getModal(details, custom) {
  if (!(details?.path && details?.id || custom)) return null;
  const {
    id
  } = details || custom;
  dialogLoadingSet.add(id);
  const dialog = createTag('div', {
    class: 'dialog-modal',
    id
  });
  const loadedEvent = new Event('milo:modal:loaded');
  if (custom) getCustomModal(custom, dialog);
  if (details) await getPathModal(details.path, dialog);
  if (isDelayedModal) {
    dialog.classList.add('delayed-modal');
    const mediaBlock = dialog.querySelector('div.media');
    if (mediaBlock) {
      mediaBlock.classList.add('in-modal');
      const {
        miloLibs,
        codeRoot
      } = getConfig();
      const base = miloLibs || codeRoot;
      loadStyle(`${base}/styles/rounded-corners.css`);
    }
  }
  const localeModal = id?.includes('locale-modal') ? 'localeModal' : 'milo';
  const analyticsEventName = window.location.hash ? window.location.hash.replace('#', '') : localeModal;
  const close = createTag('button', {
    class: 'dialog-close',
    'aria-label': 'Close',
    'daa-ll': `${analyticsEventName}:modalClose:buttonClose`
  }, CLOSE_ICON);
  const focusPlaceholder = createTag('div', {
    class: 'dialog-focus-placeholder',
    tabindex: 0
  });
  const focusVisible = {
    focusVisible: true
  };
  const focusablesOnLoad = [...dialog.querySelectorAll(FOCUSABLES)];
  const titleOnLoad = dialog.querySelector('h1, h2, h3, h4, h5');
  let firstFocusable;
  if (focusablesOnLoad.length && isElementInView(focusablesOnLoad[0])) {
    firstFocusable = focusablesOnLoad[0]; // eslint-disable-line prefer-destructuring
  } else if (titleOnLoad) {
    titleOnLoad.setAttribute('tabIndex', 0);
    firstFocusable = titleOnLoad;
  } else {
    firstFocusable = close;
  }
  let shiftTabOnClose = false;
  close.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !event.shiftKey) return;
    shiftTabOnClose = true;
    focusPlaceholder.focus(focusVisible);
  });
  focusPlaceholder.addEventListener('focus', () => {
    if (!shiftTabOnClose) close.focus(focusVisible);
    shiftTabOnClose = false;
  });
  close.addEventListener('click', e => {
    closeModal(dialog);
    e.preventDefault();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal(dialog);
    }
  });
  decorateSectionAnalytics(dialog, `${id}-modal`, getConfig());
  dialog.prepend(close);
  dialog.append(focusPlaceholder);
  document.body.append(dialog);
  dialogLoadingSet.delete(id);
  firstFocusable.focus({
    preventScroll: true,
    ...focusVisible
  });
  window.dispatchEvent(loadedEvent);
  if (!dialog.classList.contains('curtain-off')) {
    document.body.classList.add('disable-scroll');
    const curtain = createTag('div', {
      class: 'modal-curtain is-open',
      'daa-ll': `${analyticsEventName}:modalClose:curtainClose`
    });
    curtain.addEventListener('click', e => {
      if (e.target === curtain) closeModal(dialog);
    });
    dialog.insertAdjacentElement('afterend', curtain);
    [...document.querySelectorAll('header, main, footer')].forEach(element => element.setAttribute('aria-disabled', 'true'));
  }
  const iframe = dialog.querySelector('iframe');
  if (iframe) {
    if (dialog.classList.contains('commerce-frame') || dialog.classList.contains('dynamic-height')) {
      const {
        default: enableCommerceFrameFeatures
      } = await import('./modal.merch.js');
      await enableCommerceFrameFeatures({
        dialog,
        iframe
      });
    } else {
      /* Initially iframe height is set to 0% in CSS for the height auto adjustment feature.
      The height auto adjustment feature is applicable only to dialogs
      with the `commerce-frame` or `dynamic-height` classes */
      iframe.style.height = '100%';
    }
    if (!custom?.closeEvent) dialog.addEventListener('iframe:modal:closed', () => closeModal(dialog));
  }
  return dialog;
}
const hydrationToken = "modal/modal.js";
const hydrationBlocks = {
  _267: ({}) => {
    {
      {
        const interval = setInterval(() => {
          const ctas = document.querySelectorAll('a[href*="commerce.adobe.com"][aria-label*="Free trial"]');
          if (ctas.length > 0) {
            clearInterval(interval);
            ctas.forEach(cta => {
              cta.setAttribute('data-modal', 'twp');
            });
          }
        }, 300);
      }
      window.addEventListener('hashchange', e => {
        if (!window.location.hash) {
          try {
            const url = new URL(e.oldURL);
            const dialog = document.querySelector(`.dialog-modal${url.hash}`);
            if (dialog) closeModal(dialog);
          } catch (error) {}
        } else {
          const details = findDetails(window.location.hash, null);
          if (details) getModal(details);
          if (e.oldURL?.includes('#')) {
            prevHash = new URL(e.oldURL).hash;
          }
        }
      });
    }
  }
};
/**
 * Dynamic Hydration Runtime Code
 * This module provides runtime functionality for hydrating components on the client side.
 */

/**
 * Performs client-side hydration dynamically at runtime using only 'id'.
 * Processes raw hydration data collected during SSR, finds corresponding
 * code block definition using 'id', resolves elements, and executes the code.
 * Replaces build-time generation of individual init_X functions.
 *
 * @param {Array<object>} rawHydratorData Raw hydration data array from SSR.
 * Example element: {id: 0, elements: {param1: "sh-id"}, data: {param3: "value"}}
 * @param {Array<object>} blockDefinitions Array defining hydration code blocks.
 * Example element: {id: 0, code: "console.log(param1);"}
 * 'id' must uniquely identify a code block in this version.
 */
export function hydrateDynamically(rawHydratorData, blockDefinitions = []) {
  // 1. Validate Inputs
  if (!Array.isArray(rawHydratorData)) {
    console.error("Dynamic Hydration (ID Only) failed: rawHydratorData must be an array.", rawHydratorData);
    return;
  }
  if (!Array.isArray(blockDefinitions)) {
    console.error("Dynamic Hydration (ID Only) failed: blockDefinitions must be an array.", blockDefinitions);
    return;
  }
  if (rawHydratorData.length === 0) {
    console.log("No raw hydration data found.");
    return;
  }
  if (blockDefinitions.length === 0) {
    console.log("No hydration block definitions found.");
    // return;
  }

  console.log(`Starting dynamic hydration (ID Only). Found ${rawHydratorData.length} raw tasks and ${blockDefinitions.length} block definitions.`);

  // Create a map from blockDefinitions using only ID for faster lookups
  const blockMap = new Map();
  blockDefinitions.forEach(def => {
    // Check if definition has required fields (id and code)
    if (def && def.id !== undefined && typeof def.code === 'string') {
      const blockId = def.id; // Use ID as the key
      if (blockMap.has(blockId)) {
        // Warn about duplicates but allow last one to win
        console.warn(`Duplicate block definition found for id: ${blockId}. Last definition will be used.`);
      }
      blockMap.set(blockId, def.code);
    } else {
      console.warn("Invalid block definition encountered during map creation (missing id or code):", def);
    }
  });

  //   if (blockMap.size === 0) {
  //     console.error("No valid block definitions were processed into the lookup map. Cannot proceed.");
  //     return;
  //   }

  // 2. Process each raw hydration task instance from SSR
  rawHydratorData.forEach((rawTask, taskIndex) => {
    // Validate raw task structure needed for processing (only need id)
    if (!rawTask || typeof rawTask !== 'object' || rawTask.id === undefined) {
      console.warn(`Skipping invalid raw hydration task at index ${taskIndex} (missing id):`, rawTask);
      return;
    }

    // Find the corresponding code string using only the ID
    const blockId = rawTask.id;
    const blockCodeString = blockMap.get(blockId);

    // Skip if no code found for this task's block definition ID
    // if (blockCodeString === undefined) {
    //   console.warn(`No code definition found for block id "${blockId}" (Task index ${taskIndex}). Skipping task.`);
    //   return;
    // }

    try {
      const resolvedArgs = {}; // Holds resolved elements and data for this instance

      // 3. Resolve DOM Elements for this task instance
      const rawElements = rawTask.elements || {};
      for (const key in rawElements) {
        const idOrIds = rawElements[key];
        let selector = null;
        let isMultiple = false;

        if (Array.isArray(idOrIds)) {
          if (idOrIds.length > 0) {
            selector = idOrIds
              .map(mId => typeof mId === 'string' ? `[data-hydrate-multi="${mId}"]` : null)
              .filter(s => s !== null)
              .join(',');
            isMultiple = true;
            if (!selector) {
              console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): No valid multi-IDs found in array:`, idOrIds);
              resolvedArgs[key] = document.querySelectorAll(`.non-existent-class-${Date.now()}`);
              continue;
            }
          } else {
            console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): Empty array provided for multi-element IDs.`);
            resolvedArgs[key] = document.querySelectorAll(`.non-existent-class-${Date.now()}`);
            continue;
          }
        } else if (typeof idOrIds === 'string' && idOrIds.startsWith('sh-')) {
          selector = `[data-hydrate-id="${idOrIds}"]`;
          isMultiple = false;
        } else {
          console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): Invalid element ID format found:`, idOrIds);
          resolvedArgs[key] = null;
          continue;
        }

        if (selector) {
          const elementsNodeList = document.querySelectorAll(selector);
          if (isMultiple) {
            resolvedArgs[key] = elementsNodeList;
            if (elementsNodeList.length === 0) {
              console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): No elements found for selector '${selector}'`);
            }
          } else {
            resolvedArgs[key] = elementsNodeList[0] || null;
            if (!resolvedArgs[key]) {
              console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): No element found for selector '${selector}'`);
            }
          }
        } else {
          resolvedArgs[key] = isMultiple ? document.querySelectorAll(`.non-existent-class-${Date.now()}`) : null;
        }
      }

      // 4. Merge Static Data for this task instance
      const rawData = rawTask.data || {};
      for (const key in rawData) {
        if (resolvedArgs.hasOwnProperty(key)) {
          console.warn(`Dynamic Hydration (ID: ${blockId}, Task: ${taskIndex}, Key: ${key}): Data key clashes with element key. Data value will be used.`);
        }
        resolvedArgs[key] = rawData[key];
      }

      // 5. Prepare for Code Execution
      const argNames = Object.keys(resolvedArgs);
      const argValues = argNames.map(name => resolvedArgs[name]);
      console.log(argNames);

      hydrationBlocks[`_${rawTask.id}`](resolvedArgs);

      // 6. Execute the User's Hydration Code for this specific instance
      // const hydrateAction = new Function(...argNames, blockCodeString);
      // const hydrateAction = function (...argValues) { eval(blockCodeString) };
      // hydrateAction(...argValues);

    } catch (error) {
      console.error(`Error during dynamic hydration execution (ID: ${blockId}, Task Index: ${taskIndex}):`, error, "Task details:", rawTask);
    }
  });

  console.log("Dynamic hydration process finished (ID Only).");
}

/**
 * Initializes dynamic hydration when the DOM is ready
 */
export function initializeDynamicHydration() {
  // Assumes window.__HYDRATOR_DATA__ (raw SSR data array) and
  // window.__BLOCK_DEFINITIONS__ (block definitions array) are populated globally
  const token = hydrationToken;
  const rawData = (window.hydrateData || []).filter(data => data.file === token);
  const blockDefs = (window.code || [])[token];


  // Call the main hydration function
  hydrateDynamically(rawData, blockDefs);
}

// Run after DOM is ready
if (typeof document !== 'undefined') {
  initializeDynamicHydration();
};
