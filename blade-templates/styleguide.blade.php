@extends('_layout')

@section('title', 'COMPONENTNAME')

@section('critical-css')
    @component('_partials/critical-css', ['template' => 'index'])@endcomponent
@endsection

@section('content')

    @component('components.COMPONENTTYPE.COMPONENTNAME', [])
    @endcomponent

@endsection
