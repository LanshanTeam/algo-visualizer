import type { Language } from "../../core/types";

// 只展示操作函数；TreeNode 与 visit / EMPTY 视为已定义。
export const templates: Record<Language, Record<string, string>> = {
  C: {
    create: `TreeNode* build(int *seq, int *pos) { // @start
  if (seq[*pos] == EMPTY) { (*pos)++; return NULL; }
  TreeNode *node = new_node(seq[(*pos)++]); // @root
  node->left = build(seq, pos); // @left
  node->right = build(seq, pos); // @right
  return node;
} // @done`,
    preorder: `void preorder(TreeNode *node) { // @start
  if (!node) return;
  visit(node); // @visit
  preorder(node->left); // @left
  preorder(node->right); // @right
} // @done`,
    inorder: `void inorder(TreeNode *node) { // @start
  if (!node) return;
  inorder(node->left); // @left
  visit(node); // @visit
  inorder(node->right); // @right
} // @done`,
    postorder: `void postorder(TreeNode *node) { // @start
  if (!node) return;
  postorder(node->left); // @left
  postorder(node->right); // @right
  visit(node); // @visit
} // @done`,
    levelorder: `void levelorder(TreeNode *root) { // @start
  Queue q; init(&q); push(&q, root);
  while (!empty(&q)) {
    TreeNode *node = pop(&q); // @dequeue
    visit(node); // @visit
    if (node->left) push(&q, node->left); // @enqueue
    if (node->right) push(&q, node->right);
  }
} // @done`,
  },
  "C++": {
    create: `TreeNode* build(const std::vector<int>& seq, size_t& pos) { // @start
  if (seq[pos] == EMPTY) { ++pos; return nullptr; }
  auto *node = new TreeNode{seq[pos++]}; // @root
  node->left = build(seq, pos); // @left
  node->right = build(seq, pos); // @right
  return node;
} // @done`,
    preorder: `void preorder(TreeNode *node) { // @start
  if (!node) return;
  visit(node); // @visit
  preorder(node->left); // @left
  preorder(node->right); // @right
} // @done`,
    inorder: `void inorder(TreeNode *node) { // @start
  if (!node) return;
  inorder(node->left); // @left
  visit(node); // @visit
  inorder(node->right); // @right
} // @done`,
    postorder: `void postorder(TreeNode *node) { // @start
  if (!node) return;
  postorder(node->left); // @left
  postorder(node->right); // @right
  visit(node); // @visit
} // @done`,
    levelorder: `void levelorder(TreeNode *root) { // @start
  std::queue<TreeNode*> q; q.push(root);
  while (!q.empty()) {
    TreeNode *node = q.front(); q.pop(); // @dequeue
    visit(node); // @visit
    if (node->left) q.push(node->left); // @enqueue
    if (node->right) q.push(node->right);
  }
} // @done`,
  },
  Python: {
    create: `def build(seq, pos): # @start
    token = seq[pos[0]]
    pos[0] += 1
    if token is None:
        return None
    node = TreeNode(token) # @root
    node.left = build(seq, pos) # @left
    node.right = build(seq, pos) # @right
    return node # @done`,
    preorder: `def preorder(node): # @start
    if not node:
        return
    visit(node) # @visit
    preorder(node.left) # @left
    preorder(node.right) # @right
# @done`,
    inorder: `def inorder(node): # @start
    if not node:
        return
    inorder(node.left) # @left
    visit(node) # @visit
    inorder(node.right) # @right
# @done`,
    postorder: `def postorder(node): # @start
    if not node:
        return
    postorder(node.left) # @left
    postorder(node.right) # @right
    visit(node) # @visit
# @done`,
    levelorder: `def levelorder(root): # @start
    queue = deque([root])
    while queue:
        node = queue.popleft() # @dequeue
        visit(node) # @visit
        if node.left: queue.append(node.left) # @enqueue
        if node.right: queue.append(node.right)
# @done`,
  },
  Go: {
    create: `func build(seq []int, pos *int) *TreeNode { // @start
    token := seq[*pos]
    *pos = *pos + 1
    if token == empty {
        return nil
    }
    node := &TreeNode{value: token} // @root
    node.left = build(seq, pos) // @left
    node.right = build(seq, pos) // @right
    return node
} // @done`,
    preorder: `func preorder(node *TreeNode) { // @start
    if node == nil {
        return
    }
    visit(node) // @visit
    preorder(node.left) // @left
    preorder(node.right) // @right
} // @done`,
    inorder: `func inorder(node *TreeNode) { // @start
    if node == nil {
        return
    }
    inorder(node.left) // @left
    visit(node) // @visit
    inorder(node.right) // @right
} // @done`,
    postorder: `func postorder(node *TreeNode) { // @start
    if node == nil {
        return
    }
    postorder(node.left) // @left
    postorder(node.right) // @right
    visit(node) // @visit
} // @done`,
    levelorder: `func levelorder(root *TreeNode) { // @start
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        node := queue[0]; queue = queue[1:] // @dequeue
        visit(node) // @visit
        if node.left != nil { queue = append(queue, node.left) } // @enqueue
        if node.right != nil { queue = append(queue, node.right) }
    }
} // @done`,
  },
  Java: {
    create: `TreeNode build(int[] seq, int[] pos) { // @start
    int token = seq[pos[0]++];
    if (token == EMPTY) return null;
    TreeNode node = new TreeNode(token); // @root
    node.left = build(seq, pos); // @left
    node.right = build(seq, pos); // @right
    return node;
} // @done`,
    preorder: `void preorder(TreeNode node) { // @start
    if (node == null) return;
    visit(node); // @visit
    preorder(node.left); // @left
    preorder(node.right); // @right
} // @done`,
    inorder: `void inorder(TreeNode node) { // @start
    if (node == null) return;
    inorder(node.left); // @left
    visit(node); // @visit
    inorder(node.right); // @right
} // @done`,
    postorder: `void postorder(TreeNode node) { // @start
    if (node == null) return;
    postorder(node.left); // @left
    postorder(node.right); // @right
    visit(node); // @visit
} // @done`,
    levelorder: `void levelorder(TreeNode root) { // @start
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
        TreeNode node = queue.poll(); // @dequeue
        visit(node); // @visit
        if (node.left != null) queue.add(node.left); // @enqueue
        if (node.right != null) queue.add(node.right);
    }
} // @done`,
  },
  Rust: {
    create: `fn build(tokens: &mut impl Iterator<Item = Option<i32>>) -> Option<Box<TreeNode>> { // @start
    let token = tokens.next().flatten();
    let mut node = Box::new(TreeNode { value: token?, left: None, right: None }); // @root
    node.left = build(tokens); // @left
    node.right = build(tokens); // @right
    Some(node)
} // @done`,
    preorder: `fn preorder(node: &Option<Box<TreeNode>>) { // @start
    if let Some(node) = node {
        visit(node.value); // @visit
        preorder(&node.left); // @left
        preorder(&node.right); // @right
    }
} // @done`,
    inorder: `fn inorder(node: &Option<Box<TreeNode>>) { // @start
    if let Some(node) = node {
        inorder(&node.left); // @left
        visit(node.value); // @visit
        inorder(&node.right); // @right
    }
} // @done`,
    postorder: `fn postorder(node: &Option<Box<TreeNode>>) { // @start
    if let Some(node) = node {
        postorder(&node.left); // @left
        postorder(&node.right); // @right
        visit(node.value); // @visit
    }
} // @done`,
    levelorder: `fn levelorder(root: &Option<Box<TreeNode>>) { // @start
    let mut queue = VecDeque::new();
    if let Some(node) = root { queue.push_back(node); }
    while let Some(node) = queue.pop_front() { // @dequeue
        visit(node.value); // @visit
        if let Some(left) = &node.left { queue.push_back(left); } // @enqueue
        if let Some(right) = &node.right { queue.push_back(right); }
    }
} // @done`,
  },
};
