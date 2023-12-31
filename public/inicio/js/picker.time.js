(function ( factory ) {
    if ( typeof define == 'function' && define.amd )
        define( ['./picker', 'jquery'], factory )

    else if ( typeof exports == 'object' )
        module.exports = factory( require('./picker.js'), require('jquery') )

    else factory( Picker, jQuery )

}(function( Picker, $ ) {

var HOURS_IN_DAY = 24,
    MINUTES_IN_HOUR = 60,
    HOURS_TO_NOON = 12,
    MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR,
    _ = Picker._

function TimePicker( picker, settings ) {

    var clock = this,
        elementValue = picker.$node[ 0 ].value,
        elementDataValue = picker.$node.data( 'value' ),
        valueString = elementDataValue || elementValue,
        formatString = elementDataValue ? settings.formatSubmit : settings.format

    clock.settings = settings
    clock.$node = picker.$node

    clock.queue = {
        interval: 'i',
        min: 'measure create',
        max: 'measure create',
        now: 'now create',
        select: 'parse create validate',
        highlight: 'parse create validate',
        view: 'parse create validate',
        disable: 'deactivate',
        enable: 'activate'
    }

    clock.item = {}

    clock.item.clear = null
    clock.item.interval = settings.interval || 30
    clock.item.disable = ( settings.disable || [] ).slice( 0 )
    clock.item.enable = -(function( collectionDisabled ) {
        return collectionDisabled[ 0 ] === true ? collectionDisabled.shift() : -1
    })( clock.item.disable )

    clock.
        set( 'min', settings.min ).
        set( 'max', settings.max ).
        set( 'now' )

    if ( valueString ) {
        clock.set( 'select', valueString, {
            format: formatString
        })
    }

    else {
        clock.
            set( 'select', null ).
            set( 'highlight', clock.item.now )
    }

    clock.key = {
        40: 1, 
        38: -1, 
        39: 1,
        37: -1, 
        go: function( timeChange ) {
            clock.set(
                'highlight',
                clock.item.highlight.pick + timeChange * clock.item.interval,
                { interval: timeChange * clock.item.interval }
            )
            this.render()
        }
    }


    picker.
        on( 'render', function() {
            var $pickerHolder = picker.$root.children(),
                $viewset = $pickerHolder.find( '.' + settings.klass.viewset ),
                vendors = function( prop ) {
                    return ['webkit', 'moz', 'ms', 'o', ''].map(function( vendor ) {
                        return ( vendor ? '-' + vendor + '-' : '' ) + prop
                    })
                },
                animations = function( $el, state ) {
                    vendors( 'transform' ).map(function( prop ) {
                        $el.css( prop, state )
                    })
                    vendors( 'transition' ).map(function( prop ) {
                        $el.css( prop, state )
                    })
                }
            if ( $viewset.length ) {
                animations( $pickerHolder, 'none' )
                $pickerHolder[ 0 ].scrollTop = ~~$viewset.position().top - ( $viewset[ 0 ].clientHeight * 2 )
                animations( $pickerHolder, '' )
            }
        }, 1 ).
        on( 'open', function() {
            picker.$root.find( 'button' ).attr( 'disabled', false )
        }, 1 ).
        on( 'close', function() {
            picker.$root.find( 'button' ).attr( 'disabled', true )
        }, 1 )

} 
TimePicker.prototype.set = function( type, value, options ) {

    var clock = this,
        clockItem = clock.item

    if ( value === null ) {
        if ( type == 'clear' ) type = 'select'
        clockItem[ type ] = value
        return clock
    }

    clockItem[ ( type == 'enable' ? 'disable' : type == 'flip' ? 'enable' : type ) ] = clock.queue[ type ].split( ' ' ).map( function( method ) {
        value = clock[ method ]( type, value, options )
        return value
    }).pop()

    if ( type == 'select' ) {
        clock.set( 'highlight', clockItem.select, options )
    }
    else if ( type == 'highlight' ) {
        clock.set( 'view', clockItem.highlight, options )
    }
    else if ( type == 'interval' ) {
        clock.
            set( 'min', clockItem.min, options ).
            set( 'max', clockItem.max, options )
    }
    else if ( type.match( /^(flip|min|max|disable|enable)$/ ) ) {
        if ( clockItem.select && clock.disabled( clockItem.select ) ) {
            clock.set( 'select', value, options )
        }
        if ( clockItem.highlight && clock.disabled( clockItem.highlight ) ) {
            clock.set( 'highlight', value, options )
        }
        if ( type == 'min' ) {
            clock.set( 'max', clockItem.max, options )
        }
    }

    return clock
} 
TimePicker.prototype.get = function( type ) {
    return this.item[ type ]
} 

TimePicker.prototype.create = function( type, value, options ) {

    var clock = this
    value = value === undefined ? type : value

    if ( _.isDate( value ) ) {
        value = [ value.getHours(), value.getMinutes() ]
    }

    if ( $.isPlainObject( value ) && _.isInteger( value.pick ) ) {
        value = value.pick
    }

    else if ( $.isArray( value ) ) {
        value = +value[ 0 ] * MINUTES_IN_HOUR + (+value[ 1 ])
    }

    else if ( !_.isInteger( value ) ) {
        value = clock.now( type, value, options )
    }

    if ( type == 'max' && value < clock.item.min.pick ) {
        value += MINUTES_IN_DAY
    }
    if ( type != 'min' && type != 'max' && (value - clock.item.min.pick) % clock.item.interval !== 0 ) {
        value += clock.item.interval
    }

    value = clock.normalize( type, value, options )

    return {

        hour: ~~( HOURS_IN_DAY + value / MINUTES_IN_HOUR ) % HOURS_IN_DAY,
        mins: ( MINUTES_IN_HOUR + value % MINUTES_IN_HOUR ) % MINUTES_IN_HOUR,
        time: ( MINUTES_IN_DAY + value ) % MINUTES_IN_DAY,
        pick: value % MINUTES_IN_DAY
    }
} 

TimePicker.prototype.createRange = function( from, to ) {

    var clock = this,
        createTime = function( time ) {
            if ( time === true || $.isArray( time ) || _.isDate( time ) ) {
                return clock.create( time )
            }
            return time
        }

    if ( !_.isInteger( from ) ) {
        from = createTime( from )
    }
    if ( !_.isInteger( to ) ) {
        to = createTime( to )
    }

    if ( _.isInteger( from ) && $.isPlainObject( to ) ) {
        from = [ to.hour, to.mins + ( from * clock.settings.interval ) ];
    }
    else if ( _.isInteger( to ) && $.isPlainObject( from ) ) {
        to = [ from.hour, from.mins + ( to * clock.settings.interval ) ];
    }

    return {
        from: createTime( from ),
        to: createTime( to )
    }
} 

TimePicker.prototype.withinRange = function( range, timeUnit ) {
    range = this.createRange(range.from, range.to)
    return timeUnit.pick >= range.from.pick && timeUnit.pick <= range.to.pick
}


TimePicker.prototype.overlapRanges = function( one, two ) {

    var clock = this

    one = clock.createRange( one.from, one.to )
    two = clock.createRange( two.from, two.to )

    return clock.withinRange( one, two.from ) || clock.withinRange( one, two.to ) ||
        clock.withinRange( two, one.from ) || clock.withinRange( two, one.to )
}


TimePicker.prototype.now = function( type, value) {

    var interval = this.item.interval,
        date = new Date(),
        nowMinutes = date.getHours() * MINUTES_IN_HOUR + date.getMinutes(),
        isValueInteger = _.isInteger( value ),
        isBelowInterval

    nowMinutes -= nowMinutes % interval

    isBelowInterval = value < 0 && interval * value + nowMinutes <= -interval
    nowMinutes += type == 'min' && isBelowInterval ? 0 : interval
    if ( isValueInteger ) {
        nowMinutes += interval * (
            isBelowInterval && type != 'max' ?
                value + 1 :
                value
            )
    }

    return nowMinutes
} 


TimePicker.prototype.normalize = function( type, value/*, options*/ ) {

    var interval = this.item.interval,
        minTime = this.item.min && this.item.min.pick || 0

    value -= type == 'min' ? 0 : ( value - minTime ) % interval

    return value
} 

TimePicker.prototype.measure = function( type, value, options ) {

    var clock = this

    if ( !value ) {
        value = type == 'min' ? [ 0, 0 ] : [ HOURS_IN_DAY - 1, MINUTES_IN_HOUR - 1 ]
    }
    if ( typeof value == 'string' ) {
        value = clock.parse( type, value )
    }
    else if ( value === true || _.isInteger( value ) ) {
        value = clock.now( type, value, options )
    }
    else if ( $.isPlainObject( value ) && _.isInteger( value.pick ) ) {
        value = clock.normalize( type, value.pick, options )
    }

    return value
} 
TimePicker.prototype.validate = function( type, timeObject, options ) {

    var clock = this,
        interval = options && options.interval ? options.interval : clock.item.interval

    if ( clock.disabled( timeObject ) ) {

        timeObject = clock.shift( timeObject, interval )
    }

    timeObject = clock.scope( timeObject )

    if ( clock.disabled( timeObject ) ) {
        timeObject = clock.shift( timeObject, interval * -1 )
    }

    return timeObject
}

TimePicker.prototype.disabled = function( timeToVerify ) {

    var clock = this,

        isDisabledMatch = clock.item.disable.filter( function( timeToDisable ) {
            if ( _.isInteger( timeToDisable ) ) {
                return timeToVerify.hour == timeToDisable
            }

            if ( $.isArray( timeToDisable ) || _.isDate( timeToDisable ) ) {
                return timeToVerify.pick == clock.create( timeToDisable ).pick
            }

            if ( $.isPlainObject( timeToDisable ) ) {
                return clock.withinRange( timeToDisable, timeToVerify )
            }
        })

    isDisabledMatch = isDisabledMatch.length && !isDisabledMatch.filter(function( timeToDisable ) {
        return $.isArray( timeToDisable ) && timeToDisable[2] == 'inverted' ||
            $.isPlainObject( timeToDisable ) && timeToDisable.inverted
    }).length

    return clock.item.enable === -1 ? !isDisabledMatch : isDisabledMatch ||
        timeToVerify.pick < clock.item.min.pick ||
        timeToVerify.pick > clock.item.max.pick
} 
TimePicker.prototype.shift = function( timeObject, interval ) {

    var clock = this,
        minLimit = clock.item.min.pick,
        maxLimit = clock.item.max.pick

    interval = interval || clock.item.interval

    
    while ( clock.disabled( timeObject ) ) {

        timeObject = clock.create( timeObject.pick += interval )

        if ( timeObject.pick <= minLimit || timeObject.pick >= maxLimit ) {
            break
        }
    }

    return timeObject
}
TimePicker.prototype.scope = function( timeObject ) {
    var minLimit = this.item.min.pick,
        maxLimit = this.item.max.pick
    return this.create( timeObject.pick > maxLimit ? maxLimit : timeObject.pick < minLimit ? minLimit : timeObject )
} 
TimePicker.prototype.parse = function( type, value, options ) {

    var hour, minutes, isPM, item, parseValue,
        clock = this,
        parsingObject = {}

    if ( !value || typeof value != 'string' ) {
        return value
    }

    if ( !( options && options.format ) ) {
        options = options || {}
        options.format = clock.settings.format
    }

    clock.formats.toArray( options.format ).map( function( label ) {

        var
            substring,
            formattingLabel = clock.formats[ label ],
            formatLength = formattingLabel ?
                _.trigger( formattingLabel, clock, [ value, parsingObject ] ) :
                label.replace( /^!/, '' ).length

        if ( formattingLabel ) {
            substring = value.substr( 0, formatLength )
            parsingObject[ label ] = substring.match(/^\d+$/) ? +substring : substring
        }

        value = value.substr( formatLength )
    })

    for ( item in parsingObject ) {
        parseValue = parsingObject[item]
        if ( _.isInteger(parseValue) ) {
            if ( item.match(/^(h|hh)$/i) ) {
                hour = parseValue
                if ( item == 'h' || item == 'hh' ) {
                    hour %= 12
                }
            }
            else if ( item == 'i' ) {
                minutes = parseValue
            }
        }
        else if ( item.match(/^a$/i) && parseValue.match(/^p/i) && ('h' in parsingObject || 'hh' in parsingObject) ) {
            isPM = true
        }
    }

    return (isPM ? hour + 12 : hour) * MINUTES_IN_HOUR + minutes
} 


TimePicker.prototype.formats = {

    h: function( string, timeObject ) {

        return string ? _.digits( string ) : timeObject.hour % HOURS_TO_NOON || HOURS_TO_NOON
    },
    hh: function( string, timeObject ) {

        return string ? 2 : _.lead( timeObject.hour % HOURS_TO_NOON || HOURS_TO_NOON )
    },
    H: function( string, timeObject ) {
        return string ? _.digits( string ) : '' + ( timeObject.hour % 24 )
    },
    HH: function( string, timeObject ) {

        return string ? _.digits( string ) : _.lead( timeObject.hour % 24 )
    },
    i: function( string, timeObject ) {

        return string ? 2 : _.lead( timeObject.mins )
    },
    a: function( string, timeObject ) {

        return string ? 4 : MINUTES_IN_DAY / 2 > timeObject.time % MINUTES_IN_DAY ? 'a.m.' : 'p.m.'
    },
    A: function( string, timeObject ) {

        return string ? 2 : MINUTES_IN_DAY / 2 > timeObject.time % MINUTES_IN_DAY ? 'AM' : 'PM'
    },

    toArray: function( formatString ) { return formatString.split( /(h{1,2}|H{1,2}|i|a|A|!.)/g ) },

    toString: function ( formatString, itemObject ) {
        var clock = this
        return clock.formats.toArray( formatString ).map( function( label ) {
            return _.trigger( clock.formats[ label ], clock, [ 0, itemObject ] ) || label.replace( /^!/, '' )
        }).join( '' )
    }
} 
TimePicker.prototype.isTimeExact = function( one, two ) {

    var clock = this

    if (
        ( _.isInteger( one ) && _.isInteger( two ) ) ||
        ( typeof one == 'boolean' && typeof two == 'boolean' )
     ) {
        return one === two
    }

    if (
        ( _.isDate( one ) || $.isArray( one ) ) &&
        ( _.isDate( two ) || $.isArray( two ) )
    ) {
        return clock.create( one ).pick === clock.create( two ).pick
    }

    if ( $.isPlainObject( one ) && $.isPlainObject( two ) ) {
        return clock.isTimeExact( one.from, two.from ) && clock.isTimeExact( one.to, two.to )
    }

    return false
}

TimePicker.prototype.isTimeOverlap = function( one, two ) {

    var clock = this
    if ( _.isInteger( one ) && ( _.isDate( two ) || $.isArray( two ) ) ) {
        return one === clock.create( two ).hour
    }
    if ( _.isInteger( two ) && ( _.isDate( one ) || $.isArray( one ) ) ) {
        return two === clock.create( one ).hour
    }

    if ( $.isPlainObject( one ) && $.isPlainObject( two ) ) {
        return clock.overlapRanges( one, two )
    }

    return false
}


TimePicker.prototype.flipEnable = function(val) {
    var itemObject = this.item
    itemObject.enable = val || (itemObject.enable == -1 ? 1 : -1)
}


TimePicker.prototype.deactivate = function( type, timesToDisable ) {

    var clock = this,
        disabledItems = clock.item.disable.slice(0)

    if ( timesToDisable == 'flip' ) {
        clock.flipEnable()
    }

    else if ( timesToDisable === false ) {
        clock.flipEnable(1)
        disabledItems = []
    }

    else if ( timesToDisable === true ) {
        clock.flipEnable(-1)
        disabledItems = []
    }

    else {

        timesToDisable.map(function( unitToDisable ) {

            var matchFound
            for ( var index = 0; index < disabledItems.length; index += 1 ) {
                if ( clock.isTimeExact( unitToDisable, disabledItems[index] ) ) {
                    matchFound = true
                    break
                }
            }

            if ( !matchFound ) {
                if (
                    _.isInteger( unitToDisable ) ||
                    _.isDate( unitToDisable ) ||
                    $.isArray( unitToDisable ) ||
                    ( $.isPlainObject( unitToDisable ) && unitToDisable.from && unitToDisable.to )
                ) {
                    disabledItems.push( unitToDisable )
                }
            }
        })
    }

    return disabledItems
} 
TimePicker.prototype.activate = function( type, timesToEnable ) {

    var clock = this,
        disabledItems = clock.item.disable,
        disabledItemsCount = disabledItems.length

    if ( timesToEnable == 'flip' ) {
        clock.flipEnable()
    }

    else if ( timesToEnable === true ) {
        clock.flipEnable(1)
        disabledItems = []
    }

    else if ( timesToEnable === false ) {
        clock.flipEnable(-1)
        disabledItems = []
    }

    else {

        timesToEnable.map(function( unitToEnable ) {

            var matchFound,
                disabledUnit,
                index,
                isRangeMatched

            for ( index = 0; index < disabledItemsCount; index += 1 ) {

                disabledUnit = disabledItems[index]

                if ( clock.isTimeExact( disabledUnit, unitToEnable ) ) {
                    matchFound = disabledItems[index] = null
                    isRangeMatched = true
                    break
                }

                else if ( clock.isTimeOverlap( disabledUnit, unitToEnable ) ) {
                    if ( $.isPlainObject( unitToEnable ) ) {
                        unitToEnable.inverted = true
                        matchFound = unitToEnable
                    }
                    else if ( $.isArray( unitToEnable ) ) {
                        matchFound = unitToEnable
                        if ( !matchFound[2] ) matchFound.push( 'inverted' )
                    }
                    else if ( _.isDate( unitToEnable ) ) {
                        matchFound = [ unitToEnable.getFullYear(), unitToEnable.getMonth(), unitToEnable.getDate(), 'inverted' ]
                    }
                    break
                }
            }

            if ( matchFound ) for ( index = 0; index < disabledItemsCount; index += 1 ) {
                if ( clock.isTimeExact( disabledItems[index], unitToEnable ) ) {
                    disabledItems[index] = null
                    break
                }
            }

            if ( isRangeMatched ) for ( index = 0; index < disabledItemsCount; index += 1 ) {
                if ( clock.isTimeOverlap( disabledItems[index], unitToEnable ) ) {
                    disabledItems[index] = null
                    break
                }
            }
                if ( matchFound ) {
                disabledItems.push( matchFound )
            }
        })
    }

    return disabledItems.filter(function( val ) { return val != null })
} 
TimePicker.prototype.i = function( type, value/*, options*/ ) {
    return _.isInteger( value ) && value > 0 ? value : this.item.interval
}

TimePicker.prototype.nodes = function( isOpen ) {

    var
        clock = this,
        settings = clock.settings,
        selectedObject = clock.item.select,
        highlightedObject = clock.item.highlight,
        viewsetObject = clock.item.view,
        disabledCollection = clock.item.disable

    return _.node(
        'ul',
        _.group({
            min: clock.item.min.pick,
            max: clock.item.max.pick,
            i: clock.item.interval,
            node: 'li',
            item: function( loopedTime ) {
                loopedTime = clock.create( loopedTime )
                var timeMinutes = loopedTime.pick,
                    isSelected = selectedObject && selectedObject.pick == timeMinutes,
                    isHighlighted = highlightedObject && highlightedObject.pick == timeMinutes,
                    isDisabled = disabledCollection && clock.disabled( loopedTime ),
                    formattedTime = _.trigger( clock.formats.toString, clock, [ settings.format, loopedTime ] )
                return [
                    _.trigger( clock.formats.toString, clock, [ _.trigger( settings.formatLabel, clock, [ loopedTime ] ) || settings.format, loopedTime ] ),
                    (function( klasses ) {

                        if ( isSelected ) {
                            klasses.push( settings.klass.selected )
                        }

                        if ( isHighlighted ) {
                            klasses.push( settings.klass.highlighted )
                        }

                        if ( viewsetObject && viewsetObject.pick == timeMinutes ) {
                            klasses.push( settings.klass.viewset )
                        }

                        if ( isDisabled ) {
                            klasses.push( settings.klass.disabled )
                        }

                        return klasses.join( ' ' )
                    })( [ settings.klass.listItem ] ),
                    'data-pick=' + loopedTime.pick + ' ' + _.ariaAttr({
                        role: 'option',
                        label: formattedTime,
                        selected: isSelected && clock.$node.val() === formattedTime ? true : null,
                        activedescendant: isHighlighted ? true : null,
                        disabled: isDisabled ? true : null
                    })
                ]
            }
        }) +

        _.node(
            'li',
            _.node(
                'button',
                settings.clear,
                settings.klass.buttonClear,
                'type=button data-clear=1' + ( isOpen ? '' : ' disabled' ) + ' ' +
                _.ariaAttr({ controls: clock.$node[0].id })
            ),
            '', _.ariaAttr({ role: 'presentation' })
        ),
        settings.klass.list,
        _.ariaAttr({ role: 'listbox', controls: clock.$node[0].id })
    )
} 

TimePicker.defaults = (function( prefix ) {

    return {

        clear: 'Clear',
        format: 'h:i A',
        interval: 30,
        closeOnSelect: true,
        closeOnClear: true,
        updateInput: true,

        klass: {

            picker: prefix + ' ' + prefix + '--time',
            holder: prefix + '__holder',

            list: prefix + '__list',
            listItem: prefix + '__list-item',

            disabled: prefix + '__list-item--disabled',
            selected: prefix + '__list-item--selected',
            highlighted: prefix + '__list-item--highlighted',
            viewset: prefix + '__list-item--viewset',
            now: prefix + '__list-item--now',

            buttonClear: prefix + '__button--clear'
        }
    }
})( Picker.klasses().picker )

Picker.extend( 'pickatime', TimePicker )

}));



