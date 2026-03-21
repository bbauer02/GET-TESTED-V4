import { Node } from '@tiptap/core';

// ----------------------------------------------------------------------

export const MergeField = Node.create({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-merge-field'),
        renderHTML: (attributes) => ({
          'data-merge-field': attributes.field,
        }),
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-merge-label'),
        renderHTML: (attributes) => ({
          'data-merge-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'merge-field',
        contenteditable: 'false',
      },
      `{{ ${HTMLAttributes['data-merge-label'] || HTMLAttributes['data-merge-field']} }}`,
    ];
  },

  addCommands() {
    return {
      insertMergeField:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});
