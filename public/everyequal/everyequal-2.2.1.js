(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.everyEqual = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function everyEqual(
    target,
    source,
    settings = {},
    seen = new WeakMap(),
    depthIndex = 0
  ) {
    const sourceType = Object.prototype.toString.call(source);
    const targetType = Object.prototype.toString.call(target);

    if ("undefined" === typeof settings) {
      settings = {};
    }
    if ("object" !== typeof settings[targetType]) {
      settings[targetType] = {};
    }

    for (const [key, value] of Object.entries(settings)) {
      if (["deep", "maxDepth", "ignore"].includes(key)) {
        if (settings[targetType][key] === undefined) {
          settings[targetType][key] = value;
        }
      }
    }

    const {
      deep = true,
      maxDepth = Infinity,
      ignore = null,
      coerced = null,
    } = settings[targetType];

    const result = target === source;
    if ("object" !== typeof target && "object" !== typeof source && coerced) {
      const coercedTarget = coerced(target);
      if (coercedTarget === "string") {
        return target === source;
      } else if (coercedTarget === "number") {
        return Number(target) === Number(source);
      } else if (coercedTarget === "boolean") {
        return Boolean(target) === Boolean(source);
      } else if (coercedTarget === "date") {
        return new Date(target).getTime() === new Date(source).getTime();
      } else if (coercedTarget === "regexp") {
        return new RegExp(target).toString() === new RegExp(source).toString();
      }
    } else if (sourceType !== targetType) {
      return false;
    } else if (
      result ||
      "object" !== typeof target ||
      "object" !== typeof source
    ) {
      return result;
    } else if (target === undefined || source === undefined) {
      return true;
    }

    switch (targetType) {
      case "[object Array]":
        return everyArrayEqual(
          target,
          source,
          deep,
          maxDepth,
          ignore,
          settings,
          seen,
          depthIndex
        );
      case "[object Object]":
        return everyObjectEqual(
          target,
          source,
          deep,
          maxDepth,
          ignore,
          settings,
          seen,
          depthIndex
        );
      case "[object Map]":
        return everyMapEqual(
          target,
          source,
          deep,
          maxDepth,
          ignore,
          settings,
          seen,
          depthIndex
        );
      case "[object Set]":
        return everySetEqual(
          target,
          source,
          deep,
          maxDepth,
          ignore,
          settings,
          seen,
          depthIndex
        );
      case "[object ArrayBuffer]":
      case "[object Buffer]":
        const { constructor } = target;
        if (target.byteLength !== source.byteLength) {
          return false;
        }

        if (
          !constructor.isBuffer(target) ||
          !constructor.isBuffer(source) ||
          !target.equals(source)
        ) {
          return false;
        }
        return true;
      case "[object Int8Array]":
      case "[object Uint8Array]":
      case "[object Uint8ClampedArray]":
      case "[object Int16Array]":
      case "[object Uint16Array]":
      case "[object Int32Array]":
      case "[object Uint32Array]":
      case "[object Float32Array]":
      case "[object Float64Array]":
      case "[object BigInt64Array]":
      case "[object BigUint64Array]":
        if (target.length !== source.length) {
          return false;
        }
        for (let i = 0; i < target.length; i++) {
          if (target[i] !== source[i]) {
            return false;
          }
        }

        return true;
      case "[object Date]":
        if (target.getTime() !== source.getTime()) {
          return false;
        }
        return true;
      case "[object RegExp]":
        if (target.source !== source.source) {
          return false;
        }
        if (target.flags !== source.flags) {
          return false;
        }
        return true;
      case "[object Error]":
        if (target.constructor !== source.constructor) {
          return false;
        }
        if (target.name !== source.name) {
          return false;
        }
        if (target.message !== source.message) {
          return false;
        }
        if (target.stack !== source.stack) {
          return false;
        }
        return true;
      default:
        if (target !== null && source !== null) {
          if (ignore(target, source, depthIndex)) {
            return true;
          } else if (
            "object" === typeof target &&
            "object" === typeof source &&
            Object.getPrototypeOf(target) === null &&
            Object.getPrototypeOf(source) === null
          ) {
            return everyObjectEqual(
              target,
              source,
              deep,
              maxDepth,
              ignore,
              settings,
              seen,
              depthIndex
            );
          } else if ("function" === typeof settings[targetType].handler) {
            return settings[targetType].handler(
              target,
              source,
              deep,
              maxDepth,
              ignore,
              settings,
              seen,
              depthIndex
            );
          } else if (target.constructor !== source.constructor) {
            return false;
          } else if (
            target.toString &&
            source.toString &&
            target.toString() !== source.toString()
          ) {
            return false;
          }
        }
    }

    return false;
  }
  function everyArrayEqual(
    target,
    source,
    deep = true,
    maxDepth = Infinity,
    ignore = null,
    settings = {},
    seen = new WeakMap(),
    depthIndex = 0
  ) {
    const targetStr = target.flat().join("");
    const sourceStr = source.flat().join("");
    const quickCheckPassed = targetStr === sourceStr;
    if (target.length !== source.length) {
      return false;
    } else if (!quickCheckPassed) {
      return false;
    }
    for (let index = 0; index < target.length; index++) {
      const targetValue = target[index];
      const sourceValue = source[index];
      if (ignore && ignore(targetValue, sourceValue, depthIndex)) {
        continue;
      } else if (targetValue === undefined && sourceValue === undefined) {
        continue;
      } else if (targetValue === null && sourceValue === null) {
        continue;
      } else if (targetValue === sourceValue) {
        continue;
      } else if (target === targetValue && source === sourceValue) {
        continue;
      } else if (
        seen.has(targetValue) &&
        seen.get(targetValue) === sourceValue
      ) {
        continue;
      } else if (seen.has(targetValue)) {
        return false;
      }

      if (
        "object" === typeof targetValue &&
        "object" === typeof sourceValue &&
        deep &&
        depthIndex < maxDepth
      ) {
        seen.set(targetValue, sourceValue);
        if (
          !everyEqual(targetValue, sourceValue, settings, seen, depthIndex + 1)
        ) {
          return false;
        }
        seen.delete(targetValue);
      } else if (targetValue !== sourceValue) {
        return false;
      }
    }
    return true;
  }
  function everyMapEqual(
    target,
    source,
    deep = true,
    maxDepth = Infinity,
    ignore = null,
    settings = {},
    seen = new WeakMap(),
    depthIndex = 0
  ) {
    if (target.size !== source.size) {
      return false;
    }

    const { checkEqualKey = false } = settings["[object Map]"] || {};
    const targetEntries = target.entries();
    const sourceEntries = source.entries();
    const targetStr = Array.from(targetEntries).flat().join();
    const sourceStr = Array.from(sourceEntries).flat().join();
    const quickCheckPassed = targetStr === sourceStr;
    if (!quickCheckPassed) {
      return false;
    }
    for (const [targetKey, targetValue] of targetEntries) {
      const {
        value: [sourceKey, sourceValue],
        done,
      } = sourceEntries.next();
      if (done) {
        return false;
      }

      const keysEqual =
        targetKey === sourceKey ||
        (checkEqualKey &&
          everyEqual(targetKey, sourceKey, settings, seen, depthIndex));

      if (!keysEqual) {
        return false;
      }

      if (ignore && ignore(targetKey, targetValue, sourceValue, depthIndex)) {
        continue;
      }

      if (targetValue === sourceValue) {
        continue;
      }

      if (seen.has(targetValue) && seen.get(targetValue) === sourceValue) {
        continue;
      }

      if (
        deep &&
        depthIndex < maxDepth &&
        targetValue &&
        sourceValue &&
        typeof targetValue === "object" &&
        typeof sourceValue === "object"
      ) {
        seen.set(targetValue, sourceValue);
        const isEqual = everyEqual(
          targetValue,
          sourceValue,
          settings,
          seen,
          depthIndex + 1
        );
        seen.delete(targetValue);

        if (!isEqual) {
          return false;
        }
      } else if (targetValue !== sourceValue) {
        return false;
      }
    }

    if (!sourceEntries.next().done) {
      return false;
    }

    return true;
  }

  function everySetEqual(
    target,
    source,
    deep = true,
    maxDepth = Infinity,
    ignore = null,
    settings = {},
    seen = new WeakMap(),
    depthIndex = 0
  ) {
    if (target.size !== source.size) {
      return false;
    }
    if (target.size === 0 && source.size === 0) {
      return true;
    }

    const targetValues = Array.from(target.values());
    const sourceValues = Array.from(source.values());
    const targetStr = targetValues.join("");
    const sourceStr = sourceValues.join("");
    const quickCheckPassed = targetStr === sourceStr;
    if (!quickCheckPassed) {
      return false;
    }
    const matchedSources = new Set();

    for (const targetValue of targetValues) {
      if (ignore && ignore(targetValue, sourceValue, depthIndex)) {
        continue;
      } else if (targetValue === target) {
        continue;
      }
      let matched = false;

      for (const sourceValue of sourceValues) {
        if (targetValue === undefined && sourceValue === undefined) {
          continue;
        } else if (targetValue === null && sourceValue === null) {
          continue;
        } else if (matchedSources.has(sourceValue)) {
          continue;
        }

        if (targetValue === sourceValue) {
          matchedSources.add(sourceValue);
          matched = true;
          break;
        }

        if (
          deep &&
          targetValue &&
          sourceValue &&
          typeof targetValue === "object" &&
          typeof sourceValue === "object"
        ) {
          if (seen.has(targetValue) && seen.get(targetValue) === sourceValue) {
            matchedSources.add(sourceValue);
            matched = true;
            break;
          }

          if (depthIndex >= maxDepth) {
            continue;
          }

          seen.set(targetValue, sourceValue);
          if (
            everyEqual(targetValue, sourceValue, settings, seen, depthIndex + 1)
          ) {
            matchedSources.add(sourceValue);
            matched = true;
            break;
          } else {
            seen.delete(targetValue);
          }
        }
      }

      if (!matched) {
        return false;
      }
    }

    return true;
  }

  function everyObjectEqual(
    target,
    source,
    deep = true,
    maxDepth = Infinity,
    ignore = null,
    settings = {},
    seen = new WeakMap(),
    depthIndex = 0
  ) {
    const { checkDescriptor } = settings["[object Object]"];
    const targetKeys = Object.getOwnPropertyNames(target);
    const sourceKeys = Object.getOwnPropertyNames(source);
    const allTargetKeys =
      Object.getOwnPropertySymbols(target).concat(targetKeys);
    const allSourceKeys =
      Object.getOwnPropertySymbols(source).concat(sourceKeys);
    const targetStr = Object.entries(target).flat().join("");
    const sourceStr = Object.entries(source).flat().join("");
    const quickCheckPassed = targetStr === sourceStr;

    if (allTargetKeys.length !== allSourceKeys.length) {
      return false;
    } else if (!quickCheckPassed) {
      return false;
    }
    const maxKeys = new Set([...allTargetKeys, ...allSourceKeys]);
    for (const key of maxKeys) {
      const targetValue = target[key];
      const sourceValue = source[key];
      if (ignore && ignore(key, targetValue, sourceValue, depthIndex)) {
        continue;
      } else if (targetValue === undefined && sourceValue === undefined) {
        continue;
      } else if (targetValue === null && sourceValue === null) {
        continue;
      } else if (targetValue === sourceValue) {
        continue;
      } else if (target === targetValue && source === sourceValue) {
        continue;
      } else if (
        seen.has(targetValue) &&
        seen.get(targetValue) === sourceValue
      ) {
        continue;
      } else if (target.hasOwnProperty(key) && !source.hasOwnProperty(key)) {
        return false;
      } else if (!target.hasOwnProperty(key) && source.hasOwnProperty(key)) {
        return false;
      } else if (checkDescriptor) {
        const targetDescriptor = Object.getOwnPropertyDescriptor(target, key);
        const sourceDescriptor = Object.getOwnPropertyDescriptor(source, key);
        const {
          configurable: targetConfigurable,
          enumerable: targetEnumerable,
          writable: targetWritable,
        } = targetDescriptor;
        const {
          configurable: sourceConfigurable,
          enumerable: sourceEnumerable,
          writable: sourceWritable,
        } = sourceDescriptor;
        if (
          targetConfigurable !== sourceConfigurable ||
          targetEnumerable !== sourceEnumerable ||
          targetWritable !== sourceWritable
        ) {
          return false;
        }
      } else if (seen.has(targetValue)) {
        return false;
      }

      if (
        targetValue &&
        sourceValue &&
        "object" === typeof targetValue &&
        "object" === typeof sourceValue &&
        deep &&
        depthIndex < maxDepth
      ) {
        seen.set(targetValue, sourceValue);
        if (
          !everyEqual(targetValue, sourceValue, settings, seen, depthIndex + 1)
        ) {
          return false;
        }
        seen.delete(targetValue);
      } else if (targetValue !== sourceValue) {
        return false;
      }
    }
    return true;
  }
  return everyEqual;
});
