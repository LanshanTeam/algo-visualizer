import type { Language } from "../../core/types";

export const templates: Record<Language, Record<string, string>> = {
  C: {
    push: `int push(Stack *s, int value) { // @start
  if (s->top == CAP - 1) return 0; // @check
  s->data[++s->top] = value; // @push
  return 1; // @done
}`,
    pop: `int pop(Stack *s, int *out) { // @start
  if (s->top < 0) return 0; // @check
  *out = s->data[s->top]; // @top
  s->top--; // @pop
  return 1; // @done
}`,
    peek: `int peek(const Stack *s, int *out) { // @start
  if (s->top < 0) return 0; // @check
  *out = s->data[s->top]; // @top
  return 1; // @done
}`,
  },
  "C++": {
    push: `bool push(std::vector<int> &data, int value) { // @start
  if (data.size() == CAP) return false; // @check
  data.push_back(value); // @push
  return true; // @done
}`,
    pop: `bool pop(std::vector<int> &data, int &out) { // @start
  if (data.empty()) return false; // @check
  out = data.back(); // @top
  data.pop_back(); // @pop
  return true; // @done
}`,
    peek: `bool peek(const std::vector<int> &data, int &out) { // @start
  if (data.empty()) return false; // @check
  out = data.back(); // @top
  return true; // @done
}`,
  },
  Python: {
    push: `def push(s, value): # @start
    if len(s) >= CAP: # @check
        return False
    s.append(value) # @push
    return True # @done`,
    pop: `def pop(s): # @start
    if not s: # @check
        return None
    out = s[-1] # @top
    s.pop() # @pop
    return out # @done`,
    peek: `def peek(s): # @start
    if not s: # @check
        return None
    return s[-1] # @top
# 只读，不改变栈内容 # @done`,
  },
  Go: {
    push: `func push(s *[]int, value int) bool { // @start
	if len(*s) >= CAP { // @check
		return false
	}
	*s = append(*s, value) // @push
	return true // @done
}`,
    pop: `func pop(s *[]int) (int, bool) { // @start
	if len(*s) == 0 { // @check
		return 0, false
	}
	out := (*s)[len(*s)-1] // @top
	*s = (*s)[:len(*s)-1] // @pop
	return out, true // @done
}`,
    peek: `func peek(s []int) (int, bool) { // @start
	if len(s) == 0 { // @check
		return 0, false
	}
	return s[len(s)-1], true // @top
} // @done`,
  },
  Java: {
    push: `boolean push(int value) { // @start
    if (top == CAP - 1) return false; // @check
    data[++top] = value; // @push
    return true; // @done
}`,
    pop: `Integer pop() { // @start
    if (top < 0) return null; // @check
    int out = data[top]; // @top
    top--; // @pop
    return out; // @done
}`,
    peek: `Integer peek() { // @start
    if (top < 0) return null; // @check
    return data[top]; // @top
} // @done`,
  },
  Rust: {
    push: `fn push(&mut self, value: i32) -> bool { // @start
    if self.data.len() == CAP { // @check
        return false;
    }
    self.data.push(value); // @push
    true // @done
}`,
    pop: `fn pop(&mut self) -> Option<i32> { // @start
    if self.data.is_empty() { // @check
        return None;
    }
    let out = *self.data.last().unwrap(); // @top
    self.data.pop(); // @pop
    Some(out) // @done
}`,
    peek: `fn peek(&self) -> Option<i32> { // @start
    if self.data.is_empty() { // @check
        return None;
    }
    self.data.last().copied() // @top
} // @done`,
  },
};
