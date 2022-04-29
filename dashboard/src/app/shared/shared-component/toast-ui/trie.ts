// SEE https://gist.github.com/tpae/72e1c54471e88b689f85ad2b3940a8f0


// Trie.js - super simple JS implementation
// https://en.wikipedia.org/wiki/Trie

// we start with the TrieNode
class TrieNode {
    // the "key" value will be the character in sequence
    key: string;
    // we keep a reference to parent
    parent: TrieNode;
    // we have hash of children
    children: { [key: string]: TrieNode };
    // check to see if the node is at the end
    end: boolean;

    constructor(key: string) {
        this.key = key;
        this.parent = null;
        this.children = {};
        this.end = false;
    }

    // iterates through the parents to get the word.
    // time complexity: O(k), k = word length
    public getWord(): string {
        const output = [];
        let node: TrieNode = this;

        while (node !== null) {
            output.unshift(node.key);
            node = node.parent;
        }

        return output.join('');
    }
}

// we implement Trie with just a simple root with null value.
export class Trie {
    root: TrieNode;

    constructor() {
        this.root = new TrieNode(null);
    }

    // inserts a word into the trie.
    // time complexity: O(k), k = word length
    public insert(word: string) {
        let node = this.root; // we start at the root 😬

        // for every character in the word
        for(let i = 0; i < word.length; i++) {
            // check to see if character node exists in children.
            if (!node.children[word[i]]) {
                // if it doesn't exist, we then create it.
                node.children[word[i]] = new TrieNode(word[i]);

                // we also assign the parent to the child node.
                node.children[word[i]].parent = node;
            }

            // proceed to the next depth in the trie.
            node = node.children[word[i]];

            // finally, we check to see if it's the last word.
            if (i == word.length-1) {
                // if it is, we set the end flag to true.
                node.end = true;
            }
        }
    }

    // check if it contains a whole word.
    // time complexity: O(k), k = word length
    public contains(word: string) {
        let node = this.root;

        // for every character in the word
        for(let i = 0; i < word.length; i++) {
            // check to see if character node exists in children.
            if (node.children[word[i]]) {
                // if it exists, proceed to the next depth of the trie.
                node = node.children[word[i]];
            } else {
                // doesn't exist, return false since it's not a valid word.
                return false;
            }
        }

        // we finished going through all the words, but is it a whole word?
        return node.end;
    }

    // return a matcher that support character by character input
    public wordMatcher(): (word?: string) => boolean {
        let node = this.root;
        let end = false;

        return (word?: string) => {
            if (word == null || end) {
                end = true;
                return node.end;
            }

            for(let i = 0; i < word.length; i++) {
                if (node.children[word[i]]) {
                    node = node.children[word[i]];
                } else {
                    return false;
                }
            }

            return true;
        }
    }

    // returns every word with given prefix
    // time complexity: O(p + n), p = prefix length, n = number of child paths
    public find(prefix: string) {
        let node = this.root;
        const output = [];

        // for every character in the prefix
        for(let i = 0; i < prefix.length; i++) {
            // make sure prefix actually has words
            if (node.children[prefix[i]]) {
                node = node.children[prefix[i]];
            } else {
                // there's none. just return it.
                return output;
            }
        }

        // recursively find all words in the node
        findAllWords(node, output);

        return output;
    };
}

// recursive function to find all words in the given node.
function findAllWords(node: TrieNode, arr: string[]) {
    // base case, if node is at a word, push to output
    if (node.end) {
        arr.unshift(node.getWord());
    }

    // iterate through each children, call recursive findAllWords
    for (var child in node.children) {
        findAllWords(node.children[child], arr);
    }
}
