import type { Language } from "../../core/types";

// 只展示操作函数；TreeNode、new_node / visit 等辅助函数视为已定义。
// Rust 版用数组下标表示左右孩子，避免为了演示删除而引入过多指针细节。
export const templates: Record<Language, Record<string, string>> = {
  C: {
    create: `TreeNode* build(int *seq, int n) { // @start
  TreeNode *root = NULL;
  for (int i = 0; i < n; i++) {
    int value = seq[i];
    if (!root) {
      root = new_node(value); // @insert
      continue;
    }
    TreeNode *node = root;
    while (node) {
      if (value < node->value) {
        if (!node->left) {
          node->left = new_node(value); // @insert
          break;
        }
        node = node->left; // @compare
      } else {
        if (!node->right) {
          node->right = new_node(value); // @insert
          break;
        }
        node = node->right; // @compare
      }
    }
  }
  return root; // @done
}`,
    search: `TreeNode* search(TreeNode *root, int target) { // @start
  TreeNode *node = root;
  while (node) { // @compare
    if (target == node->value) return node; // @found
    node = target < node->value ? node->left : node->right;
  }
  return NULL; // @miss
} // @done`,
    insert: `TreeNode* insert(TreeNode *root, int target) { // @start
  if (!root) return new_node(target);
  TreeNode *node = root;
  while (node) { // @compare
    if (target == node->value) return root; // @exists
    if (target < node->value) {
      if (!node->left) {
        node->left = new_node(target); // @insert
        return root;
      }
      node = node->left;
    } else {
      if (!node->right) {
        node->right = new_node(target); // @insert
        return root;
      }
      node = node->right;
    }
  }
  return root; // @done
}`,
    delete: `TreeNode* delete_node(TreeNode *root, int target) { // @start
  TreeNode *parent = NULL, *node = root;
  while (node) { // @compare
    if (target == node->value) break; // @found
    parent = node;
    node = target < node->value ? node->left : node->right;
  }
  if (!node) return root; // @miss
  if (!node->left && !node->right) { // @leaf
    if (!parent) root = NULL;
    else if (parent->left == node) parent->left = NULL;
    else parent->right = NULL;
    free(node);
  } else if (!node->left || !node->right) { // @one_child
    TreeNode *child = node->left ? node->left : node->right;
    if (!parent) root = child;
    else if (parent->left == node) parent->left = child;
    else parent->right = child;
    free(node);
  } else {
    TreeNode *succ = node->right, *succ_parent = node;
    while (succ->left) { // @successor
      succ_parent = succ;
      succ = succ->left;
    }
    node->value = succ->value; // @copy
    if (succ_parent->left == succ) succ_parent->left = succ->right; // @remove
    else succ_parent->right = succ->right; // @remove
    free(succ);
  }
  return root; // @done
}`,
  },
  "C++": {
    create: `TreeNode* build(const std::vector<int>& seq) { // @start
  TreeNode *root = nullptr;
  for (int value : seq) {
    if (!root) {
      root = new TreeNode{value}; // @insert
      continue;
    }
    TreeNode *node = root;
    while (node) {
      if (value < node->value) {
        if (!node->left) {
          node->left = new TreeNode{value}; // @insert
          break;
        }
        node = node->left; // @compare
      } else {
        if (!node->right) {
          node->right = new TreeNode{value}; // @insert
          break;
        }
        node = node->right; // @compare
      }
    }
  }
  return root; // @done
}`,
    search: `TreeNode* search(TreeNode *root, int target) { // @start
  TreeNode *node = root;
  while (node) { // @compare
    if (target == node->value) return node; // @found
    node = target < node->value ? node->left : node->right;
  }
  return nullptr; // @miss
} // @done`,
    insert: `TreeNode* insert(TreeNode *root, int target) { // @start
  if (!root) return new TreeNode{target};
  TreeNode *node = root;
  while (node) { // @compare
    if (target == node->value) return root; // @exists
    if (target < node->value) {
      if (!node->left) {
        node->left = new TreeNode{target}; // @insert
        return root;
      }
      node = node->left;
    } else {
      if (!node->right) {
        node->right = new TreeNode{target}; // @insert
        return root;
      }
      node = node->right;
    }
  }
  return root; // @done
}`,
    delete: `TreeNode* deleteNode(TreeNode *root, int target) { // @start
  TreeNode *parent = nullptr, *node = root;
  while (node) { // @compare
    if (target == node->value) break; // @found
    parent = node;
    node = target < node->value ? node->left : node->right;
  }
  if (!node) return root; // @miss
  if (!node->left && !node->right) { // @leaf
    if (!parent) root = nullptr;
    else if (parent->left == node) parent->left = nullptr;
    else parent->right = nullptr;
    delete node;
  } else if (!node->left || !node->right) { // @one_child
    TreeNode *child = node->left ? node->left : node->right;
    if (!parent) root = child;
    else if (parent->left == node) parent->left = child;
    else parent->right = child;
    delete node;
  } else {
    TreeNode *succ = node->right, *succ_parent = node;
    while (succ->left) { // @successor
      succ_parent = succ;
      succ = succ->left;
    }
    node->value = succ->value; // @copy
    if (succ_parent->left == succ) succ_parent->left = succ->right; // @remove
    else succ_parent->right = succ->right; // @remove
    delete succ;
  }
  return root; // @done
}`,
  },
  Python: {
    create: `def build(seq): # @start
    root = None
    for value in seq:
        if root is None:
            root = TreeNode(value) # @insert
            continue
        node = root
        while node:
            if value < node.value:
                if node.left is None:
                    node.left = TreeNode(value) # @insert
                    break
                node = node.left # @compare
            else:
                if node.right is None:
                    node.right = TreeNode(value) # @insert
                    break
                node = node.right # @compare
    return root # @done`,
    search: `def search(root, target): # @start
    node = root
    while node: # @compare
        if target == node.value:
            return node # @found
        node = node.left if target < node.value else node.right
    return None # @miss
# @done`,
    insert: `def insert(root, target): # @start
    if root is None:
        return TreeNode(target)
    node = root
    while node: # @compare
        if target == node.value:
            return root # @exists
        if target < node.value:
            if node.left is None:
                node.left = TreeNode(target) # @insert
                return root
            node = node.left
        else:
            if node.right is None:
                node.right = TreeNode(target) # @insert
                return root
            node = node.right
    return root # @done`,
    delete: `def delete_node(root, target): # @start
    parent = None
    node = root
    while node: # @compare
        if target == node.value:
            break # @found
        parent = node
        node = node.left if target < node.value else node.right
    if node is None:
        return root # @miss
    if node.left is None and node.right is None: # @leaf
        if parent is None:
            root = None
        elif parent.left is node:
            parent.left = None
        else:
            parent.right = None
    elif node.left is None or node.right is None: # @one_child
        child = node.left or node.right
        if parent is None:
            root = child
        elif parent.left is node:
            parent.left = child
        else:
            parent.right = child
    else:
        succ_parent = node
        succ = node.right
        while succ.left: # @successor
            succ_parent = succ
            succ = succ.left
        node.value = succ.value # @copy
        if succ_parent.left is succ:
            succ_parent.left = succ.right # @remove
        else:
            succ_parent.right = succ.right # @remove
    return root # @done`,
  },
  Go: {
    create: `func build(seq []int) *TreeNode { // @start
    var root *TreeNode
    for _, value := range seq {
        if root == nil {
            root = newNode(value) // @insert
            continue
        }
        node := root
        for node != nil {
            if value < node.value {
                if node.left == nil {
                    node.left = newNode(value) // @insert
                    break
                }
                node = node.left // @compare
            } else {
                if node.right == nil {
                    node.right = newNode(value) // @insert
                    break
                }
                node = node.right // @compare
            }
        }
    }
    return root // @done
}`,
    search: `func search(root *TreeNode, target int) *TreeNode { // @start
    node := root
    for node != nil { // @compare
        if target == node.value {
            return node // @found
        }
        if target < node.value {
            node = node.left
        } else {
            node = node.right
        }
    }
    return nil // @miss
} // @done`,
    insert: `func insert(root *TreeNode, target int) *TreeNode { // @start
    if root == nil {
        return newNode(target)
    }
    node := root
    for node != nil { // @compare
        if target == node.value {
            return root // @exists
        }
        if target < node.value {
            if node.left == nil {
                node.left = newNode(target) // @insert
                return root
            }
            node = node.left
        } else {
            if node.right == nil {
                node.right = newNode(target) // @insert
                return root
            }
            node = node.right
        }
    }
    return root // @done
}`,
    delete: `func deleteNode(root *TreeNode, target int) *TreeNode { // @start
    var parent *TreeNode
    node := root
    for node != nil { // @compare
        if target == node.value {
            break // @found
        }
        parent = node
        if target < node.value {
            node = node.left
        } else {
            node = node.right
        }
    }
    if node == nil {
        return root // @miss
    }
    if node.left == nil && node.right == nil { // @leaf
        if parent == nil {
            root = nil
        } else if parent.left == node {
            parent.left = nil
        } else {
            parent.right = nil
        }
    } else if node.left == nil || node.right == nil { // @one_child
        child := node.left
        if child == nil {
            child = node.right
        }
        if parent == nil {
            root = child
        } else if parent.left == node {
            parent.left = child
        } else {
            parent.right = child
        }
    } else {
        succParent, succ := node, node.right
        for succ.left != nil { // @successor
            succParent = succ
            succ = succ.left
        }
        node.value = succ.value // @copy
        if succParent.left == succ {
            succParent.left = succ.right // @remove
        } else {
            succParent.right = succ.right // @remove
        }
    }
    return root // @done
}`,
  },
  Java: {
    create: `TreeNode build(int[] seq) { // @start
    TreeNode root = null;
    for (int value : seq) {
        if (root == null) {
            root = new TreeNode(value); // @insert
            continue;
        }
        TreeNode node = root;
        while (node != null) {
            if (value < node.value) {
                if (node.left == null) {
                    node.left = new TreeNode(value); // @insert
                    break;
                }
                node = node.left; // @compare
            } else {
                if (node.right == null) {
                    node.right = new TreeNode(value); // @insert
                    break;
                }
                node = node.right; // @compare
            }
        }
    }
    return root; // @done
}`,
    search: `TreeNode search(TreeNode root, int target) { // @start
    TreeNode node = root;
    while (node != null) { // @compare
        if (target == node.value) return node; // @found
        node = target < node.value ? node.left : node.right;
    }
    return null; // @miss
} // @done`,
    insert: `TreeNode insert(TreeNode root, int target) { // @start
    if (root == null) return new TreeNode(target);
    TreeNode node = root;
    while (node != null) { // @compare
        if (target == node.value) return root; // @exists
        if (target < node.value) {
            if (node.left == null) {
                node.left = new TreeNode(target); // @insert
                return root;
            }
            node = node.left;
        } else {
            if (node.right == null) {
                node.right = new TreeNode(target); // @insert
                return root;
            }
            node = node.right;
        }
    }
    return root; // @done
}`,
    delete: `TreeNode deleteNode(TreeNode root, int target) { // @start
    TreeNode parent = null, node = root;
    while (node != null) { // @compare
        if (target == node.value) break; // @found
        parent = node;
        node = target < node.value ? node.left : node.right;
    }
    if (node == null) return root; // @miss
    if (node.left == null && node.right == null) { // @leaf
        if (parent == null) root = null;
        else if (parent.left == node) parent.left = null;
        else parent.right = null;
    } else if (node.left == null || node.right == null) { // @one_child
        TreeNode child = node.left != null ? node.left : node.right;
        if (parent == null) root = child;
        else if (parent.left == node) parent.left = child;
        else parent.right = child;
    } else {
        TreeNode succParent = node, succ = node.right;
        while (succ.left != null) { // @successor
            succParent = succ;
            succ = succ.left;
        }
        node.value = succ.value; // @copy
        if (succParent.left == succ) succParent.left = succ.right; // @remove
        else succParent.right = succ.right; // @remove
    }
    return root; // @done
}`,
  },
  Rust: {
    create: `fn build(seq: &[i32], nodes: &mut Vec<TreeNode>) -> Option<usize> { // @start
    let mut root = None;
    for &value in seq {
        let id = nodes.len();
        nodes.push(TreeNode::new(value));
        if root.is_none() {
            root = Some(id); // @insert
            continue;
        }
        let mut node = root.unwrap();
        loop {
            if value < nodes[node].value {
                if nodes[node].left.is_none() {
                    nodes[node].left = Some(id); // @insert
                    break;
                }
                node = nodes[node].left.unwrap(); // @compare
            } else {
                if nodes[node].right.is_none() {
                    nodes[node].right = Some(id); // @insert
                    break;
                }
                node = nodes[node].right.unwrap(); // @compare
            }
        }
    }
    root // @done
}`,
    search: `fn search(nodes: &[TreeNode], root: Option<usize>, target: i32) -> Option<usize> { // @start
    let mut node = root;
    while let Some(i) = node { // @compare
        if nodes[i].value == target {
            return Some(i); // @found
        }
        node = if target < nodes[i].value { nodes[i].left } else { nodes[i].right };
    }
    None // @miss
} // @done`,
    insert: `fn insert(nodes: &mut Vec<TreeNode>, root: Option<usize>, target: i32) -> Option<usize> { // @start
    let id = nodes.len();
    nodes.push(TreeNode::new(target));
    let Some(mut node) = root else { return Some(id); };
    loop { // @compare
        if target == nodes[node].value {
            nodes.pop();
            return root; // @exists
        }
        if target < nodes[node].value {
            if let Some(left) = nodes[node].left {
                node = left;
            } else {
                nodes[node].left = Some(id); // @insert
                return root;
            }
        } else if let Some(right) = nodes[node].right {
            node = right;
        } else {
            nodes[node].right = Some(id); // @insert
            return root;
        }
    }
} // @done`,
    delete: `fn delete(nodes: &mut Vec<TreeNode>, root: Option<usize>, target: i32) -> Option<usize> { // @start
    let mut parent = None;
    let mut node = root;
    while let Some(i) = node { // @compare
        if nodes[i].value == target {
            break; // @found
        }
        parent = node;
        node = if target < nodes[i].value { nodes[i].left } else { nodes[i].right };
    }
    let Some(i) = node else { return root; }; // @miss
    let (left, right) = (nodes[i].left, nodes[i].right);
    if left.is_none() && right.is_none() { // @leaf
        if let Some(p) = parent {
            if nodes[p].left == Some(i) {
                nodes[p].left = None;
            } else {
                nodes[p].right = None;
            }
        } else {
            return None;
        }
    } else if left.is_none() || right.is_none() { // @one_child
        let child = left.or(right);
        if let Some(p) = parent {
            if nodes[p].left == Some(i) {
                nodes[p].left = child;
            } else {
                nodes[p].right = child;
            }
        } else {
            return child;
        }
    } else {
        let mut succ_parent = i;
        let mut succ = right.unwrap();
        while let Some(next) = nodes[succ].left { // @successor
            succ_parent = succ;
            succ = next;
        }
        nodes[i].value = nodes[succ].value; // @copy
        let child = nodes[succ].right;
        if nodes[succ_parent].left == Some(succ) {
            nodes[succ_parent].left = child; // @remove
        } else {
            nodes[succ_parent].right = child; // @remove
        }
    }
    root // @done
}`,
  },
};
