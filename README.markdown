Aspect.js
=========

Aspect.js adds "before", "after" and "instead" filters to existing classes and objects. Say draggable behaviour to photo, or ajax loading to tabs. Works fine with class inheritance. 

Example:
      // class skeleton
      Photo = Class.create({
          initialize: function(element) {
              this.element = $(element);
              this.element.observe('mousedown', function(e) {
                  this.dragStart([e.pointerX(), e.pointerY()]);
                  DraggableController.start(this);
              }.bindAsEventListener(this));
          },
    
          dragStart: function(pointer) {},
    
          dragEnd: function(pointer) {},
    
          drag: function(pointer) {}
      });

      // draggable behaviour
      Aspect.add(Photo.prototype, 'moving', {
          "after dragStart": function(pointer) {
              var position = this.element.positionedOffset();
              this.mouseOffset = [pointer[0] - position[0], pointer[1] - position[1]];
              this.element.absolutize();
          },
    
          "after dragEnd": function(pointer) {
              var style = this.element.style;
              style.position = style.top = style.left = style.bottom = style.right = '';
          },

          "after drag": function(pointer) {
              this.calculatePosition(pointer);
              this.element.style.left = this.position[0] + 'px';
              this.element.style.top  = this.position[1] + 'px';
          },

          calculatePosition: function(pointer) {
              this.position = [pointer[0] - this.mouseOffset[0], pointer[1] - this.mouseOffset[1]];
          }
      });
      
      var photo = new Photo($('.photo'))

      // selectable behaviuor for concrete photo
      Aspect.add(photo, 'selectable', {
          "after dragStart": function(e) {
              this.element.addClassName('selected');
          }
      });



Released under the MIT License