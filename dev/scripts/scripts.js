document.addEventListener('DOMContentLoaded', function() {


	// Global Variables: Variables requiring a global scope
	// ----------------------------------------------------------------------------
	var transitionEvent  = whichTransitionEvent(),
		animationEvent   = whichAnimationEvent(),
		elHTML           = document.documentElement,
		elBody           = document.body,
		elOverlay;


	// Helper: Check when a CSS transition or animation has ended
	// ----------------------------------------------------------------------------
	function whichTransitionEvent() {

		var trans,
			element     = document.createElement('fakeelement'),
			transitions = {
				'transition'       : 'transitionend',
				'OTransition'      : 'oTransitionEnd',
				'MozTransition'    : 'transitionend',
				'WebkitTransition' : 'webkitTransitionEnd'
			}

		for (trans in transitions) {
			if (element.style[trans] !== undefined) {
				return transitions[trans];
			}
		}

	}

	function whichAnimationEvent() {

		var anim,
			element    = document.createElement('fakeelement'),
			animations = {
				'animation'       : 'animationend',
				'OAnimation'      : 'oAnimationEnd',
				'MozAnimation'    : 'animationend',
				'WebkitAnimation' : 'webkitAnimationEnd'
			}

		for (anim in animations) {
			if (element.style[anim] !== undefined) {
				return animations[anim];
			}
		}

	}


	// Helper: Find Parent Element by Class or Tag Name
	// ----------------------------------------------------------------------------
	function findParentClass(el, className) {

		while (el && !classie.has(el, className) ) {
			el = el.parentNode;
		}

		return el;

	}

	function findParentTag(el, tagName) {

		while (el && el.nodeName !== tagName) {
			el = el.parentNode;
		}

		return el;

	}


	// Helper: CSS Fade In / Out
	// ----------------------------------------------------------------------------
	function fadeIn(thisElement) {

		// make the element fully transparent
		// (don't rely on a predefined CSS style... declare this with JS to getComputedStyle)
		thisElement.style.opacity = 0;

		// make sure the initial state is applied
		window.getComputedStyle(thisElement).opacity;

		// set opacity to 1 (CSS transition will handle the fade)
		thisElement.style.opacity = 1;

	}

	function fadeOut(thisElement) {

		// set opacity to 0 (CSS transition will handle the fade)
		thisElement.style.opacity = 0;

	}


	// Helper: Lock / Unlock Body Scrolling
	// ----------------------------------------------------------------------------
	function lockBody() {

		classie.add(elHTML, 'overlay_active');

		// if necessary, accomodate for scrollbar width
		if (hasScrollbar) {
			elBody.style.paddingRight = numScrollbarWidth + 'px';
			elMainNav.style.paddingRight = numScrollbarWidth + 'px';
		}

	}

	function unlockBody() {

		classie.remove(elHTML, 'overlay_active');

		// if necessary, remove scrollbar width styles
		// should be expanded to restore original padding if needed
		if (hasScrollbar) {
			elBody.style.paddingRight = '0px';
			elMainNav.style.paddingRight = '0px';
		}

	}


	// Helper: Create and Destroy [data-overlay] element
	// ----------------------------------------------------------------------------
	function createOverlay(childElement, strLabel) {

		// create document fragment
		var docFrag = document.createDocumentFragment();

		lockBody();

		// create empty overlay <div>
		elOverlay = document.createElement('div');

		// set data-overlay attribute as passed strLabel value
		elOverlay.setAttribute('data-overlay', strLabel);

		// append passed child elements
		elOverlay.appendChild(childElement);

		// append the [data-overlay] to the document fragement
		docFrag.appendChild(elOverlay);

		// empty document fragment into <body>
		elBody.appendChild(docFrag);

		fadeIn(elOverlay);

	}

	function destroyOverlay() {

		fadeOut(elOverlay);

		// listen for CSS transitionEnd before removing the element
		elOverlay.addEventListener(transitionEvent, removeOverlay);

		// maybe expand this to be passed an ID, and it can destroy / remove any element?
		function removeOverlay(e) {

			// only listen for the opacity property
			if (e.propertyName == "opacity") {

				unlockBody();

				// remove elOverlay from <body>
				elBody.removeChild(elOverlay);

				// must remove event listener!
				elOverlay.removeEventListener(transitionEvent, removeOverlay);

			}

		}

	}


	// selectDropdown: Pair each <select> element with its <ul> sibling
	// ----------------------------------------------------------------------------
	function selectDropdown() {

		// search for any div.wrap_select elements
		var arrSelectWrap   = document.getElementsByClassName('wrap_select'),
			numSelectLength = arrSelectWrap.length;

		// check if div.wrap_select exists and is not empty
		if (typeof arrSelectWrap !== 'undefined' && numSelectLength > 0) {

			for (var i = 0; i < numSelectLength; i++) {
				dropdownToggle(arrSelectWrap[i]);
			}

			passSelectValue();

		} else {

			return; // array not found or empty... exit function

		}

		// function for toggling dropdowns
		function dropdownToggle(thisSelectWrap) {

			var thisDropdownToggle = thisSelectWrap.getElementsByClassName('dropdown_toggle')[0];

			thisDropdownToggle.addEventListener('click', function(e) {

				// run through each div.wrap_select...
				for (var i = 0; i < numSelectLength; i++) {

					// and if this is NOT the parent div.wrap_select we have clicked on...
					if (arrSelectWrap[i] != thisSelectWrap) {
						classie.remove(arrSelectWrap[i], 'toggle_show');
					}

				}

				classie.toggle(thisSelectWrap, 'toggle_show');

				e.preventDefault(); // requires the event.preventDefault for the document listener to work

			});

			// click outside of element to close dropdown
			document.addEventListener('click', function(e) {

				// if this is not the currently toggled dropdown
				if (e.target != thisDropdownToggle) {

					// ignore this event if preventDefault has been called
					if (e.defaultPrevented) {
						return;
					}

					// hide dropdown
					classie.remove(thisSelectWrap, 'toggle_show');

				}

			});

		}

		// function for passing <ul> values to the corresponding <select>
		function passSelectValue() {

			var arrDropdownLinks = document.getElementsByClassName('dropdown_link');

			// assign the click event to each a.dropdown_link found in the document
			for (var i = 0; i < arrDropdownLinks.length; i++) {
				optionChange(arrDropdownLinks[i]);
			}

			function optionChange(thisDropdownLink) {

				thisDropdownLink.addEventListener('click', function(e) {

					var dataValue        = this.getAttribute('data-value'),
						dataLabel        = this.innerHTML,
						elParentLI       = this.parentNode,
						elParentUL       = elParentLI.parentNode,
						elParentWrap     = findParentClass(elParentUL, 'wrap_select'),
						elSiblingLabel   = findParentClass(elParentUL, 'wrap_dropdown').previousElementSibling.childNodes[1], // 1st child = empty textNode
						elMatchedOption  = elParentWrap.querySelector('option[value="' + dataValue + '"]'),
						dataPrevSelected = elParentWrap.getAttribute('data-selected'),
						elPrevSelected   = elParentUL.querySelector('a[data-value="' + dataPrevSelected + '"]');

					// define the correct <option> as :selected
					elMatchedOption.selected = true;

					// set 'data-selected' to new value
					elParentWrap.setAttribute('data-selected', dataValue);

					// replace div.dropdown_label innerHTML with the selected option text
					elSiblingLabel.innerHTML = dataLabel;

					// remove 'selected' class from previous <li>, if it exists...
					if (elPrevSelected != null) {
						classie.remove(elPrevSelected.parentNode, 'selected');
					}

					// then add 'selected' class to parent <li> of newly chosen a[data-value]
					classie.add(elParentLI, 'selected');

					// hide the parent dropdown
					classie.remove(elParentWrap, 'toggle_show');

					e.preventDefault();

				});

			}

		}

	}


	// Initialize Primary Functions
	// ----------------------------------------------------------------------------
	// selectDropdown();


});