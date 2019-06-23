var find_style_node = function(node) {
    if (!node) {
        return undefined;
    }
    if (node instanceof HTMLElement) {
        return node;
    }
    return find_style_node(node.parentNode);
}

var get_bg_color = function(node) {
    if (!node) {
        return [255.0, 255.0, 255.0];
    }
    var comp_style = window.getComputedStyle(node, null);
    if (comp_style.getPropertyValue('background-image') != 'none') {
        return [];
    }
    var bg = comp_style.getPropertyValue('background-color');
    if (bg.includes('rgba')) {
        var parent_style_node = find_style_node(node.parentNode);
        var parent_bg = get_bg_color(parent_style_node);
        if (parent_bg.length == 0) {
            return [];
        }
        var vals = bg.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*.\d*)\s*\)$/i);
        if (vals) {
            alpha = Number(vals[4]);
            return [
                (1.0-alpha)*parent_bg[0]+alpha*Number(vals[1]),
                (1.0-alpha)*parent_bg[1]+alpha*Number(vals[2]),
                (1.0-alpha)*parent_bg[2]+alpha*Number(vals[3])];
        }
    } else if (bg.includes('rgb')) {
        var vals = bg.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (vals) {
            return [
                Number(vals[1]),
                Number(vals[2]),
                Number(vals[3])];
        }
    }
    return [255.0, 255.0, 255.0];
}

var make_monochrome = function(node) {
    // style precedence: inline > id > class > element
    var style_node = find_style_node(node);
    if (!style_node) {
        return
    }

    var bg_color = get_bg_color(style_node);

    var desiredColor, desiredBorder;
    if (bg_color.length == 0) {
        desiredColor = 'white'
        desiredBorder = '-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black';
    } else {
        var gray = (bg_color[0]+bg_color[1]+bg_color[2])/3.0;
        desiredColor = gray > 128.0 ? 'black' : 'white';
        desiredBorder = 'none';
    }
    if (style_node.style.color != desiredColor) {
        style_node.style.setProperty('color', desiredColor, 'important');
    }
    if (style_node.style.textBorder != desiredBorder) {
        style_node.style.setProperty('text-shadow', desiredBorder, 'important');
    }
}

var run_once = false;

chrome.storage.local.get(['is_active'], function(result) {
    if (result.is_active && !run_once) {
        console.log('monochrome-web start');
        run_once = true;

        // Convert existing nodes
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        var node;
        while (node = walker.nextNode()) {
            console.log(node.wholeText);
            make_monochrome(node);
        }

        var config = {
            attributes: true,
            attributeFilter: ['style'],
            childList: true,
            subtree: true,
        };

        // Monitor future changes to DOM
        var observer = new MutationObserver(function(mutationList, observer) {
            for (var mutation of mutationList) {
                if (mutation.type == 'childList') {
                    for (var node of mutation.addedNodes) {
                        make_monochrome(node);
                    }
                } else if (mutation.type == 'attributes') {
                    make_monochrome(mutation.target);
                }
            }
        });
        observer.observe(document.body, config);

        console.log('monochrome-web done')
    }
});
