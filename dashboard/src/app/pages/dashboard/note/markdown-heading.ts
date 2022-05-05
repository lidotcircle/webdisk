import { MdNode, HeadingMdNode } from '@toast-ui/editor/types/toastmark';


const headingRootInfoSymbol = Symbol('root-heading-info');
const headingInfoSymbol = Symbol('heading-info');
interface LevelInfo {
    levels: number[];
    level: number;
    node?: HeadingMdNode;
    parent?: LevelInfo;
    children?: LevelInfo[];
};

export function GenerateHeadingInfo(node: MdNode): LevelInfo[]
{
    if (!node) return;
    let _root = node;
    while (_root.parent != null) _root = _root.parent;
    if (_root[headingRootInfoSymbol]) return _root[headingRootInfoSymbol];

    const root = _root;
    const headingNodes: HeadingMdNode[] = [];
    let highestLevel = 8;

    let head = root.firstChild;
    while (head != null) {
        if (head.type == 'heading') {
            const heading = head as HeadingMdNode;
            headingNodes.push(heading);
            highestLevel = Math.min(highestLevel, heading.level);
        }

        head = head.next;
    }

    const infoRoot: LevelInfo = {levels: [], level: highestLevel - 1};
    let currentNode = infoRoot;
    for (const hnode of headingNodes) {
        while (hnode.level > currentNode.level + 1) {
            currentNode.children = currentNode.children || [];
            const l2 = currentNode.levels.slice();
            l2.push(currentNode.children.length + 1);
            const newnode = {
                levels: l2,
                level: currentNode.level + 1,
                parent: currentNode,
            };
            currentNode.children.push(newnode);
            currentNode = newnode;
        }

        while (hnode.level < currentNode.level + 1) {
            console.assert(currentNode.parent != null);
            currentNode = currentNode.parent;
        }

        currentNode.children = currentNode.children || [];
        const l2 = currentNode.levels.slice();
        l2.push(currentNode.children.length + 1);
        const newnode = {
            levels: l2,
            level: hnode.level,
            node: hnode,
            parent: currentNode,
        };
        hnode[headingInfoSymbol] = newnode;
        currentNode.children.push(newnode);
        currentNode = newnode;
    }

    root[headingRootInfoSymbol] = infoRoot;
    return infoRoot.children;
}

export function GetHeadingNodeInfo(node: HeadingMdNode): LevelInfo {
    const info = node[headingInfoSymbol];
    if (info) {
        return info;
    } else {
        GenerateHeadingInfo(node);
        return node[headingInfoSymbol]
    }
}

export function ReGenerateHeadingInfo(node: MdNode): LevelInfo[]
{
    if (!node) return;
    let _root = node;
    while (_root.parent != null) _root = _root.parent;
    _root[headingRootInfoSymbol] = null;

    return GenerateHeadingInfo(node);
}
