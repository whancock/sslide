(function($) {

	// Default configuration properties.
	var defaults = {
		visible : 5,
		index : 0
	};

	$.stratosphere = function(e, o) {

		this.options = $.extend({}, defaults, o || {});
		this.container = $(e);
		this.frame = $('#window-frame');
		this.index = this.options.index;
		
		this.cache = {};
		this.loading = {};

		var self = this;
		this.funcNext = function() {
			self.next();
		};
		this.funcPrev = function() {
			self.prev();
		};

		// handle our next/prev buttons
		this.buttonNext = $('#downnav');
		this.buttonPrev = $('#upnav');

		// bind click events to buttons
		this.buttonNext.bind('click.stratosphere', this.funcNext);
		this.buttonPrev.bind('click.stratosphere', this.funcPrev);

		var index = $.cookies.get('imgindex') ? $.cookies.get('imgindex') : this.options.index;
		this.scroll(index);
	};

	$.stratosphere.fn = $.stratosphere.prototype;
	$.stratosphere.fn.extend = $.stratosphere.extend = $.extend;

	$.stratosphere.fn.extend({

		next : function() {
		
			if(this.index < totalImageCount - this.options.visible && !this.cache[this.index+this.options.visible]) {
				return;
			}
			
			if(this.index + 1 >= totalImageCount) {
				return;
			}
		
			var head = $('#img_' + this.index);
			this.index++;
			this.container.animate({marginTop : "-=" + head.height()}, "fast");
			
			this.manage();
		},

		prev : function() {
			
			if(!this.cache[this.index-1]) {
				return;
			}
			
			this.index--;
			var head = $('#img_' + this.index);
			this.container.animate({marginTop : "+=" + head.height()}, "fast");
			
			this.manage();
		},

		add : function(index, count, callback) {
			
			var self = this;
			
			$.getJSON(self.options.url, {
				img_index : index,
				img_count : count
			}, function(data) {
				$.each(data, function(i, o) {
					$('#img_' + o.index).html(self.formatEl(o)).hide().imagesLoaded(function(images, proper, broken) {
						self.cache[o.index] = o;
						self.loading[o.index] = false;
						if(callback) callback(this, o.index, self);
					});
				});
			});
		},

		scroll: function(index) {
			
			var self = this;
			this.index = index;
			this.manageElements();
			
			//add the visible images
			this.add(this.index, this.options.visible, function(el) {el.fadeIn();});
			
			var preStart = Math.max(0, this.index - this.options.visible);
			var preCount = Math.min(this.options.visible, this.index);
			if(preCount > 0) {
				this.add(preStart, preCount, function(el, o){
					el.show();
					self.container.css('marginTop', "-=" + el.height());
				});
			}
			
			var postStart = Math.min(totalImageCount, this.index+this.options.visible);
			var postCount = Math.min(this.options.visible, totalImageCount - postStart);
			if(postCount > 0) {
				this.add(postStart, postCount);
			}
		},
		
		dispLogic: function(el, index, self) {
			if(index < self.index) {
				self.container.queue(function(next) {
					el.show();
					self.container.css('marginTop', "-=" + el.height());
					next();
				});
			}
		},
		
		manage: function() {
			
			$.cookies.set('imgindex', this.index);
			
			this.fade();
			this.manageElements();
			
			var startIndex = Math.max(0, this.index - this.options.visible);
			var endIndex = Math.min(totalImageCount, this.index + (this.options.visible*2));
			
			for(var i=startIndex; i<=endIndex; i++) {
				if(!this.loading[i])
					this.cacheImg(i);
			}
			
		},
		
		/*
		 * manages actually showing the proper images
		 * calculates a range based on current index and visible
		 */
		cacheImg: function(i) {
			
			var self = this;
			
			if(!this.cache[i]) {
				this.loading[i] = true;
				this.add(i, 1, self.dispLogic);
			} else {
				var el = $('#img_' + i);
				if(!el.html().length > 0) {
					el.html(self.formatEl(self.cache[i])).hide().imagesLoaded(function(i, p, b) {
						self.dispLogic(this, this.attr('id').replace('img_', ''), self);
					});
				}
			}
		},
		
		fade: function() {
			/*
			 * fade in any elements added after click on next
			 */
			for(var i=this.index; i<this.index+this.options.visible; i++) {
				var el = $('#img_'+i);
				if(el.is(':hidden')) {
					el.fadeIn();
				}
			}
			
			/*
			 * fade out tail elements after click on prev
			 */
			for(var i=this.index+this.options.visible; i<totalImageCount; i++) {
				var el = $('#img_'+i);
				if(el) {
					el.fadeOut();
				} else {
					break;
				}
			}
		},
		
		/*
		 * manages the DOM, so is responsible for removing <li>s out of range
		 * and adding in range <li>s
		 */
		manageElements: function() {
			
			var startIndex = Math.max(0, this.index - (this.options.visible*2));
			var endIndex = Math.min(totalImageCount, this.index + (this.options.visible*3));
			
			//get first and last div elements ids
			var liArr = $("#latest-image-list > li");
			
			var firstLi = liArr.first();
			
			if(firstLi.length > 0) {
				firstLi = Number(firstLi.attr('id').replace('img_', ''));
			} else {
				firstLi = this.index + 1;
			}
			
			for(var i=firstLi-1; i>=startIndex; i--) {
				$('#latest-image-list').prepend('<li id="img_'+i+'"></li>');
			}
			
			var self = this;
			for(var i = startIndex - 1; i >= 0; i--) {
				el = $('#img_'+i);
				if(el.length > 0) {
					this.container.queue(function(next) {
						self.container.css('marginTop', "+=" + el.height());
						el.remove();
						next();
					});
				} else {
					break;
				}
			}

			var lastLi = liArr.last();
			
			if(lastLi.length > 0) {
				lastLi = Number(lastLi.attr('id').replace('img_', ''));
			} else {
				lastLi = this.index;
			}
			
			for(var i=lastLi+1; i<endIndex; i++) {
				$('#latest-image-list').append('<li id="img_'+i+'"></li>');
			}
			
			for(var i=endIndex+1; i<totalImageCount; i++) {
				el = $('#img_'+i);
				if(el.length > 0) {
					el.remove();
				} else {
					break;
				}
			}
			
		},
		
		formatEl: function(el) {
			
			var factory = '<a href="'+el.link+'"><img src="'+el.src+'"></a>';
			//factory += '<h3>'+el.title+'</h3>';
			if(el.desc) {
				factory += '<div class="index-desc">'+el.desc+'</div>';
			}
			factory += '<div class="spacer"></div>';
			return factory;
		}
		
	});

	$.stratosphere.extend( {
		defaults : function(d) {
			return $.extend(defaults, d || {});
		}
	});

	$.fn.stratosphere = function(o) {
		return this.each(function() {
			new $.stratosphere(this, o);
		});
	};
	
})(jQuery);
