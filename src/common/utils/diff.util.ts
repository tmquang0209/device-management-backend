import { diff_match_patch } from '@dmsnell/diff-match-patch';
import * as jsondiffpatch from 'jsondiffpatch';

export const jsonDiffPatchInstance = jsondiffpatch.create({
  objectHash: function (obj) {
    return (
      (obj as { _id?: string; id?: string })?._id ||
      (obj as { _id?: string; id?: string })?.id
    );
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false,
  },
  textDiff: {
    diffMatchPatch: diff_match_patch,
    minLength: 60,
  },
  propertyFilter: function (name) {
    return !name.startsWith('$');
  },
  cloneDiffValues: true,
});
