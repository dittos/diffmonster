import { parsePatch, parseHunkHeader } from './PatchParser';

const patch = "@@ -16,10 +16,14 @@\n \n package com.linecorp.armeria.common;\n \n+import static java.util.Objects.requireNonNull;\n+\n import java.util.concurrent.CompletableFuture;\n import java.util.concurrent.CompletionStage;\n import java.util.concurrent.Future;\n \n+import javax.annotation.Nullable;\n+\n /**\n  * An RPC {@link Response}. It is a {@link CompletionStage} whose result signifies the return value of an RPC\n  * call.\n@@ -29,7 +33,7 @@\n     /**\n      * Creates a new successfully complete {@link RpcResponse}.\n      */\n-    static RpcResponse of(Object value) {\n+    static RpcResponse of(@Nullable Object value) {\n         return new DefaultRpcResponse(value);\n     }\n \n@@ -41,6 +45,39 @@ static RpcResponse ofFailure(Throwable cause) {\n     }\n \n     /**\n+     * Creates a new {@link RpcResponse} that is completed successfully or exceptionally based on the\n+     * completion of the specified {@link CompletionStage}.\n+     */\n+    static RpcResponse from(CompletionStage<?> stage) {\n+        requireNonNull(stage, \"stage\");\n+        final DefaultRpcResponse res = new DefaultRpcResponse();\n+        stage.whenComplete((value, cause) -> {\n+            if (cause != null) {\n+                res.completeExceptionally(cause);\n+            } else {\n+                res.complete(value);\n+            }\n+        });\n+        return res;\n+    }\n+\n+    /**\n+     * Returns the result value if completed successfully or\n+     * throws an unchecked exception if completed exceptionally.\n+     *\n+     * @see CompletableFuture#join()\n+     */\n+    Object join();\n+\n+    /**\n+     * Returns the specified {@code valueIfAbsent} when not complete, or\n+     * returns the result value or throws an exception when complete.\n+     *\n+     * @see CompletableFuture#getNow(Object)\n+     */\n+    Object getNow(Object valueIfAbsent);\n+\n+    /**\n      * Returns the cause of the failure if this {@link RpcResponse} completed exceptionally.\n      *\n      * @return the cause, or"

describe('parsePatch', () => {
  it('parses patch', () => {
    expect(parsePatch(patch)).toMatchSnapshot();
  });
});

describe('parseHunkHeader', () => {
  it('parses header', () => {
    expect(parseHunkHeader('@@ -12,34 +56,78 @@ remainder')).toEqual({
      from: {start: 12, count: 34},
      to: {start: 56, count: 78},
    });
  });

  it('parses header with an addition and no deletions', () => {
    expect(parseHunkHeader('@@ -0,0 +1 @@ remainder')).toEqual({
      from: {start: 0, count: 0},
      to: {start: 1, count: 1},
    });
  });

  it('parses header with an addition and a deletion', () => {
    expect(parseHunkHeader('@@ -1 +1 @@ remainder')).toEqual({
      from: {start: 1, count: 1},
      to: {start: 1, count: 1},
    });
  });
});
