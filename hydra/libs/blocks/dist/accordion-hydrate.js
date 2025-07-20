const mediaCollection = {};
/* c8 ignore next 8 */
function playVideo(video) {
  if (!video) return;
  if (video.getAttribute('autoplay') === null) return;
  const playBtn = video.nextElementSibling;
  const isPlaying = playBtn.getAttribute('aria-pressed') === 'true';
  if (isPlaying || video.readyState === 0) return;
  playBtn.click();
}

/* c8 ignore next 11 */
function pauseVideo(video) {
  if (!video) return;
  if (video.getAttribute('controls') !== null) {
    video.pause();
    return;
  }
  const pauseBtn = video.nextElementSibling;
  const isPlaying = pauseBtn?.getAttribute('aria-pressed') === 'true';
  if (!isPlaying || video.readyState === 0) return;
  pauseBtn.click();
}

function openPanel(btn, panel) {
  const analyticsValue = btn.getAttribute('daa-ll'); // Get the analytics value
  btn.setAttribute('aria-expanded', 'true'); // Update aria-expanded for accessibility
  btn.setAttribute('daa-ll', analyticsValue.replace(/open-/, 'close-')); // Change analytics state
  panel.removeAttribute('hidden'); // Make the panel visible
}

function closePanel(btn, panel) {
  const analyticsValue = btn.getAttribute('daa-ll');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('daa-ll', analyticsValue.replace(/close-/, 'open-'));
  panel.setAttribute('hidden', '');
}

function closeMediaPanel(displayArea, el, dd, clickedId) {
  closePanel(el, dd);
  const clickedMedia = displayArea.childNodes[clickedId - 1];
  const video = clickedMedia?.querySelector('video');
  if (video) pauseVideo(video);
  const otherExpandedPanels = el.closest('.accordion').querySelectorAll('.accordion-trigger[aria-expanded="true"]');
  if (!otherExpandedPanels.length) return;
  clickedMedia.classList.remove('expanded');
  const newExpandedId = otherExpandedPanels[0].id.split('trigger-')[1] - 1;
  displayArea.childNodes[newExpandedId].classList.add('expanded');
}

function openMediaPanel(displayArea, el, dd, clickedId) {
  const accordionId = el.getAttribute('aria-controls').split('-')[1];
  [...mediaCollection[accordionId]].forEach((mediaCollectionItem, idx) => {
    const video = mediaCollectionItem.querySelector('video');
    if (idx === clickedId - 1) {
      openPanel(el, dd);
      displayArea?.childNodes[idx]?.classList.add('expanded');
      if (video) playVideo(video);
      return;
    }
    mediaCollectionItem.classList.remove('expanded');
    const trigger = document.querySelector(`#accordion-${accordionId}-trigger-${idx + 1}`);
    const content = document.querySelector(`#accordion-${accordionId}-content-${idx + 1}`);
    closePanel(trigger, content);
    if (video) pauseVideo(video);
  });
}

function handleClick(el, dd, num) {
  const expandAllBtns = el.closest('.accordion-container')?.querySelectorAll('.accordion-expand-all button');
  if (expandAllBtns.length) {
    expandAllBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', 'mixed');
      btn.classList.remove('fill');
      btn.disabled = false;
    });
  }
  const closestEditorial = el.closest('.editorial');
  const expanded = el.getAttribute('aria-expanded') === 'true';
  if (closestEditorial) {
    if (expanded) {
      closeMediaPanel(closestEditorial.querySelector('.accordion-media'), el, dd, num);
      return;
    }
    openMediaPanel(closestEditorial.querySelector('.accordion-media'), el, dd, num);
    return;
  }
  if (expanded) {
    closePanel(el, dd);
    return;
  }
  openPanel(el, dd);
}
const hydrationToken = "accordion/accordion.js";
const hydrationBlocks = {
  _154: ({
    button,
    dd,
    num,
    id
  }) => {
    button.addEventListener('click', e => {
      handleClick(e.target, dd, num, id);
    });
  },
  _213: ({
    expandBtn
  }) => {
    expandBtn.addEventListener('click', ({
      currentTarget
    }) => toggleAll(currentTarget, 'expand'));
  },
  _217: ({
    collapseBtn
  }) => {
    collapseBtn.addEventListener('click', ({
      currentTarget
    }) => toggleAll(currentTarget, 'collapse'));
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
