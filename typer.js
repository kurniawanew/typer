var Word = Backbone.Model.extend({
	move: function() {
		this.set({y:this.get('y') + this.get('speed')});
	}
});

var Words = Backbone.Collection.extend({
	model:Word
});

var ControlView = Backbone.View.extend({
	initialize: function() {
		var self = this;
		$(this.el).append(
			$('<div>').append(
				$('<button>')
					.addClass('btn btn-success')
					.attr('type', 'button')
					.html('Start')
					.css({
						margin: '0 5px'
					})
					.click(function () {
						self.model.set('run', false);
						self.clearWords();
						self.model.set('run', true);
						$('body').find('input').focus()
						$('#scoreText').text('0');
					}),
				$('<button>')
					.addClass('btn btn-danger')
					.attr('type', 'button')
					.html('Stop')
					.css({
						margin: '0 5px'
					})
					.click(function() {
						self.model.set('run', false);
						self.clearWords();
						$('#scoreText').text('0');
					}),
				$('<button>')
					.addClass('btn btn-warning')
					.attr('type', 'button')
					.html('Pause')
					.css({
						margin: '0 5px'
					})
					.click(function () {
						self.model.set('run', false);
					}),
				$('<button>')
					.addClass('btn btn-info')
					.attr('type', 'button')
					.html('Resume')
					.css({
						margin: '0 5px'
					})
					.click(function () {
						self.model.set('run', true);
						$('body').find('input').focus()
					})
			)
			.css({
				width: '100%',
				'text-align': 'center',
				'z-index': '1000',
				position: 'absolute'
			})
		);
	},
	clearWords: function() {
		var words_to_be_removed = [];
		var words = this.model.get('words');
		for (var i = 0; i < words.length; i++) {
			var word = words.at(i);
			word.move();
			words_to_be_removed.push(word);
		}

		for (var i = 0; i < words_to_be_removed.length; i++) {
			words.remove(words_to_be_removed[i]);
		}
	}
});

var ScoreView = Backbone.View.extend({
	initialize: function() {
		$(this.el).append(
			$('<div>').append(
				$('<strong>').html('Score: '),
				$('<strong>').html('0')
					.attr('id', 'scoreText')
			)
			.css({
				top: '0',
				left: '0',
				'font-size': '20px'
			})
		);
	}
});

var WordView = Backbone.View.extend({
	initialize: function() {
		$(this.el).css({position:'absolute'});
		var string = this.model.get('string');
		var letter_width = 25;
		var word_width = string.length * letter_width;
		if(this.model.get('x') + word_width > $(window).width()) {
			this.model.set({x:$(window).width() - word_width});
		}
		var self = this;
		$(window).resize(function() {
			self.model.set({ x: $(window).width() - word_width });
		});
		for(var i = 0;i < string.length;i++) {
			$(this.el)
				.append($('<div>')
					.css({
						width:letter_width + 'px',
						padding:'5px 2px',
						'border-radius':'4px',
						'background-color':'#fff',
						border:'1px solid #ccc',
						'text-align':'center',
						float:'left'
					})
					.text(string.charAt(i).toUpperCase()));
		}
		
		this.listenTo(this.model, 'remove', this.remove);
		
		this.render();
	},
	
	render:function() {
		$(this.el).css({
			top:this.model.get('y') + 'px',
			left:this.model.get('x') + 'px'
		});
		var highlight = this.model.get('highlight');
		$(this.el).find('div').each(function(index,element) {
			if(index < highlight) {
				$(element).css({'font-weight':'bolder','background-color':'#aaa',color:'#fff'});
			} else {
				$(element).css({'font-weight':'normal','background-color':'#fff',color:'#000'});
			}
		});
	}
});

var TyperView = Backbone.View.extend({
	initialize: function() {
		var wrapper = $('<div>')
			.css({
				position:'fixed',
				top:'0',
				left:'0',
				width:'100%',
				height:'100%'
			});
		this.wrapper = wrapper;
		
		var self = this;
		var text_input = $('<input>')
			.addClass('form-control')
			.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'0',
				'min-width':'80%',
				width:'80%',
				'margin-bottom':'10px',
				'z-index':'1000'
			}).keyup(function(e) {
				var words = self.model.get('words');
				var isWrong = false;
				var key = e.keyCode || e.charCode;
				console.log(key);
				for(var i = 0;i < words.length;i++) {
					var word = words.at(i);
					var typed_string = $(this).val();
					var string = word.get('string');
					if(string.toLowerCase().indexOf(typed_string.toLowerCase()) == 0 && $(this).val() != "") {
						word.set({highlight:typed_string.length});
						if(typed_string.length == string.length) {
							$(this).val('');
						}
						if (key != 8 && key != 46) {
							$('#scoreText').text(parseInt($('#scoreText').text()) + 1);
						}
						isWrong = false;
						break;
					} else {
						word.set({highlight:0});
						isWrong = true;
					}
				}
				if (isWrong && (key != 8 && key != 46)) {
					$('#scoreText').text(parseInt($('#scoreText').text()) - 1);
				}
			});
		
		$(this.el)
			.append(wrapper
				.append($('<form>')
					.attr({
						role:'form'
					})
					.submit(function() {
						return false;
					})
					.append(text_input)))
			.append(new ControlView({
				el: wrapper,
				model: self.model
			}))
			.append(new ScoreView({
				el: wrapper,
				model: self.model
			}));
		
		text_input.css({left:((wrapper.width() - text_input.width()) / 2) + 'px'});
		text_input.focus();
		
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		var model = this.model;
		var words = model.get('words');
		
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			if(!word.get('view')) {
				var word_view_wrapper = $('<div>');
				this.wrapper.append(word_view_wrapper);
				word.set({
					view:new WordView({
						model: word,
						el: word_view_wrapper
					})
				});
			} else {
				word.get('view').render();
			}
		}
	}
});

var Typer = Backbone.Model.extend({
	defaults:{
		max_num_words:10,
		min_distance_between_words:50,
		words:new Words(),
		min_speed:1,
		max_speed:5,
		run: false
	},
	
	initialize: function() {
		new TyperView({
			model: this,
			el: $(document.body)
		});
	},

	start: function() {
		var animation_delay = 10; // set to 10 for non laggy animation
		var self = this;
		setInterval(function() {
			if(self.get('run')) {
				self.iterate();
			}
		},animation_delay);
	},
	
	iterate: function() {
		var words = this.get('words');
		if(words.length < this.get('max_num_words')) {
			var top_most_word = undefined;
			for(var i = 0;i < words.length;i++) {
				var word = words.at(i);
				if(!top_most_word) {
					top_most_word = word;
				} else if(word.get('y') < top_most_word.get('y')) {
					top_most_word = word;
				}
			}
			
			if(!top_most_word || top_most_word.get('y') > this.get('min_distance_between_words')) {
				var random_company_name_index = this.random_number_from_interval(0,company_names.length - 1);
				var string = company_names[random_company_name_index];
				var filtered_string = '';
				for(var j = 0;j < string.length;j++) {
					if(/^[a-zA-Z()]+$/.test(string.charAt(j))) {
						filtered_string += string.charAt(j);
					}
				}
				
				var word = new Word({
					x:this.random_number_from_interval(0,$(window).width()),
					y:0,
					string:filtered_string,
					speed:this.random_number_from_interval(this.get('min_speed'),this.get('max_speed'))
				});
				words.add(word);
			}
		}
		
		var words_to_be_removed = [];
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			word.move();
			
			if(word.get('y') > $(window).height() || word.get('move_next_iteration')) {
				words_to_be_removed.push(word);
			}
			
			if(word.get('highlight') && word.get('string').length == word.get('highlight')) {
				word.set({move_next_iteration:true});
			}
		}
		
		for(var i = 0;i < words_to_be_removed.length;i++) {
			words.remove(words_to_be_removed[i]);
		}
		
		this.trigger('change');
	},
	
	random_number_from_interval: function(min,max) {
	    return Math.floor(Math.random()*(max-min+1)+min);
	}
});