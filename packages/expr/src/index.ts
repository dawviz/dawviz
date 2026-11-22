// @dawviz/expr (AD-13, T-29): ngôn ngữ biểu thức an toàn cho thuộc tính widget. Zero-dependency; chạy được ở Node, trình duyệt, Worker và CI.
// Dùng: `const c = compile(nguồn, { vars, result, easings })` một lần khi nạp/sửa, rồi `c.evaluate(ctx, ngânSách)` mỗi khung.
export { ExprError, LIMITS, parse, tokenize, type ExprErrorCode, type Node, type Program } from './parse.ts';
export {
  BUILTIN_NAMES, FRAME_BUDGET, colorToHex, compile, hexToColor, isFiniteValue,
  type Budget, type Color, type CompileOptions, type Compiled, type EvalCtx, type Type, type Value, type Vec,
} from './compile.ts';
